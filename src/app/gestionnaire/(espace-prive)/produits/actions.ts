"use server";

import {
  AuditAction,
  StoreProductStatus,
} from "@prisma/client";

import {
  revalidatePath,
} from "next/cache";

import {
  db,
} from "@/prisma/db";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  requireGestionnaireSession,
} from "@/server/gestionnaire/session";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * SERVER ACTIONS — MES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/produits/actions.ts
 *
 * RESPONSABILITÉS :
 *
 * - recevoir les actions déclenchées depuis la page Mes produits ;
 * - revérifier systématiquement la session côté serveur ;
 * - récupérer la boutique depuis la session authentifiée ;
 * - ne jamais accepter storeId ou managerId depuis le navigateur ;
 * - vérifier que le produit ciblé appartient bien à cette boutique ;
 * - retirer proprement un produit de l'espace Gestionnaire ;
 * - préserver les commandes et mouvements de stock historiques ;
 * - préserver le qrToken existant ;
 * - tracer l'opération sensible dans AuditLog ;
 * - revalider les pages concernées après modification.
 *
 * PAGE :
 *
 * /gestionnaire/produits
 *
 * IMPORTANT :
 *
 * Le navigateur peut uniquement transmettre :
 *
 * productId
 *
 * Il ne décide JAMAIS :
 *
 * - du storeId ;
 * - du managerId ;
 * - de l'appartenance du produit ;
 * - du droit réel d'accès au produit.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES UTILISÉES
   ========================================================================== */

const GESTIONNAIRE_PRODUCTS_PATH =
  "/gestionnaire/produits";


const GESTIONNAIRE_ADD_PRODUCT_PATH =
  "/gestionnaire/produits/ajouter";


/* ==========================================================================
   LIMITES
   ========================================================================== */

const PRODUCT_ID_MIN_LENGTH =
  8;


const PRODUCT_ID_MAX_LENGTH =
  128;


/**
 * Les IDs Prisma actuels sont des CUID.
 *
 * On reste volontairement légèrement plus tolérant afin de ne pas
 * coupler inutilement cette action à une longueur précise de CUID.
 *
 * Sont acceptés :
 *
 * - lettres ;
 * - chiffres ;
 * - tiret ;
 * - underscore.
 */

const PRODUCT_ID_PATTERN =
  /^[A-Za-z0-9_-]+$/;


/* ==========================================================================
   ACTION STATE
   ========================================================================== */

export type DeleteGestionnaireProductActionState =
  Readonly<{
    status:
      "idle" |
      "success" |
      "error";

    message:
      string |
      null;

    productId:
      string |
      null;
  }>;


/* ==========================================================================
   NORMALISATION STRING
   ========================================================================== */

function normalizeString(
  value:
    unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


/* ==========================================================================
   PRODUCT ID — VALIDATION
   ========================================================================== */

function normalizeProductId(
  value:
    FormDataEntryValue |
    null,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalized =
    normalizeString(
      value,
    );


  if (
    normalized.length <
      PRODUCT_ID_MIN_LENGTH ||
    normalized.length >
      PRODUCT_ID_MAX_LENGTH
  ) {
    return null;
  }


  if (
    !PRODUCT_ID_PATTERN.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   ACTION RESULT HELPERS
   ========================================================================== */

function buildDeleteErrorState(
  message:
    string,
): DeleteGestionnaireProductActionState {
  return {
    status:
      "error",

    message,

    productId:
      null,
  };
}


function buildDeleteSuccessState(
  productId:
    string,
): DeleteGestionnaireProductActionState {
  return {
    status:
      "success",

    message:
      "Produit supprimé.",

    productId,
  };
}


/* ==========================================================================
   DELETE / ARCHIVE PRODUCT
   --------------------------------------------------------------------------
   STRATÉGIE MÉTIER :

   Nous ne faisons PAS :

   db.product.delete()

   Pourquoi ?

   Product et StoreProduct peuvent être liés à :

   - OrderItem ;
   - StockMovement ;
   - QR Code ;
   - historique commercial ;
   - données de boutique ;
   - catalogue officiel.

   Une suppression physique risquerait donc :

   - de casser les commandes historiques ;
   - de perdre les références de stock ;
   - de supprimer une identité produit encore utile ;
   - de provoquer des erreurs de contraintes PostgreSQL.

   La suppression depuis "Mes produits" signifie donc :

   StoreProduct.status = ARCHIVED

   Résultat :

   - le produit disparaît de Mes produits ;
   - il n'est plus commercialisé normalement ;
   - le QR n'est pas régénéré ;
   - les historiques sont conservés ;
   - les anciennes commandes restent cohérentes ;
   - le Product global n'est pas détruit.

   Cette stratégie fonctionne également pour un produit provenant
   du catalogue L&E, car elle ne détruit jamais le Product partagé.
   ========================================================================== */

export async function deleteGestionnaireProductAction(
  _previousState:
    DeleteGestionnaireProductActionState,

  formData:
    FormData,
): Promise<DeleteGestionnaireProductActionState> {
  /* ------------------------------------------------------------------------
     1. PRODUCT ID FOURNI PAR LE FORMULAIRE
     ------------------------------------------------------------------------
     productId est une cible.
     
     Ce n'est PAS une preuve d'autorisation.
     ------------------------------------------------------------------------ */

  const productId =
    normalizeProductId(
      formData.get(
        "productId",
      ),
    );


  if (
    !productId
  ) {
    return buildDeleteErrorState(
      "Produit invalide.",
    );
  }


  try {
    /* ----------------------------------------------------------------------
       2. ACCÈS PRIVÉ
       ----------------------------------------------------------------------
       Le scope réel de la boutique vient exclusivement du serveur.
       ---------------------------------------------------------------------- */

    const access =
      await requireGestionnairePrivateAccess();


    const session =
      await requireGestionnaireSession();


    const storeId =
      access.store.id;


    const managerId =
      session.gestionnaireId;


    if (
      !storeId ||
      !managerId
    ) {
      /*
       * Fail closed.
       *
       * Cette situation ne devrait pas arriver lorsque les services
       * d'accès remplissent correctement leur contrat.
       */

      return buildDeleteErrorState(
        "Votre session Gestionnaire n’est plus valide.",
      );
    }


    /* ----------------------------------------------------------------------
       3. TRANSACTION
       ----------------------------------------------------------------------
       La vérification de propriété, l'archivage et l'audit sont regroupés
       dans la même transaction.
       ---------------------------------------------------------------------- */

    const archivedProduct =
      await db.$transaction(
        async (
          transaction,
        ) => {
          /* ----------------------------------------------------------------
             3.1 PRODUIT CIBLÉ
             ----------------------------------------------------------------
             On recherche avec :

             - productId ;
             - storeId réel de la session ;
             - StoreProduct non archivé.

             Ainsi, fournir l'ID d'un produit d'une autre boutique
             ne permet jamais d'y accéder.
             ---------------------------------------------------------------- */

          const target =
            await transaction
              .storeProduct
              .findFirst({
                where: {
                  storeId,

                  productId,

                  status: {
                    not:
                      StoreProductStatus
                        .ARCHIVED,
                  },
                },

                select: {
                  id:
                    true,

                  productId:
                    true,

                  qrToken:
                    true,

                  status:
                    true,

                  product: {
                    select: {
                      name:
                        true,

                      sku:
                        true,
                    },
                  },
                },
              });


          if (
            !target
          ) {
            /*
             * Même réponse pour :
             *
             * - produit inexistant ;
             * - produit déjà archivé ;
             * - produit appartenant à une autre boutique.
             *
             * On évite ainsi de révéler l'existence d'un produit
             * appartenant à un autre Gestionnaire.
             */

            return null;
          }


          /* ----------------------------------------------------------------
             3.2 ARCHIVAGE SÉCURISÉ
             ----------------------------------------------------------------
             updateMany ajoute une seconde vérification du storeId.
             
             Même si l'état de la base change entre la lecture et
             l'écriture, aucune autre boutique ne peut être touchée.
             ---------------------------------------------------------------- */

          const archiveResult =
            await transaction
              .storeProduct
              .updateMany({
                where: {
                  id:
                    target.id,

                  storeId,

                  productId,

                  status: {
                    not:
                      StoreProductStatus
                        .ARCHIVED,
                  },
                },

                data: {
                  status:
                    StoreProductStatus
                      .ARCHIVED,
                },
              });


          if (
            archiveResult.count !==
            1
          ) {
            return null;
          }


          /* ----------------------------------------------------------------
             3.3 AUDIT LOG
             ----------------------------------------------------------------
             Aucune donnée sensible n'est enregistrée.

             On conserve uniquement les informations métier nécessaires
             pour comprendre l'opération ultérieurement.
             ---------------------------------------------------------------- */

          await transaction
            .auditLog
            .create({
              data: {
                storeId,

                managerId,

                action:
                  AuditAction.DELETE,

                entityType:
                  "StoreProduct",

                entityId:
                  target.id,

                metadata: {
                  operation:
                    "ARCHIVE_STORE_PRODUCT",

                  productId:
                    target.productId,

                  productName:
                    target.product.name,

                  sku:
                    target.product.sku,
                },
              },
            });


          return {
            storeProductId:
              target.id,

            productId:
              target.productId,

            qrToken:
              target.qrToken,
          };
        },
      );


    /* ----------------------------------------------------------------------
       4. PRODUIT INTROUVABLE / NON AUTORISÉ
       ----------------------------------------------------------------------
       Le message reste volontairement générique.
       ---------------------------------------------------------------------- */

    if (
      !archivedProduct
    ) {
      return buildDeleteErrorState(
        "Ce produit est introuvable ou n’est plus disponible dans votre espace.",
      );
    }


    /* ----------------------------------------------------------------------
       5. REVALIDATION
       ----------------------------------------------------------------------
       Mes produits :

       - la ligne disparaît ;
       - les KPI sont recalculés ;
       - la pagination est recalculée.

       La fiche privée est également invalidée.

       La page Ajouter est invalidée afin d'éviter qu'un ancien état
       de modification soit conservé.
       ---------------------------------------------------------------------- */

    revalidatePath(
      GESTIONNAIRE_PRODUCTS_PATH,
    );


    revalidatePath(
      `${GESTIONNAIRE_PRODUCTS_PATH}/${productId}`,
    );


    revalidatePath(
      GESTIONNAIRE_ADD_PRODUCT_PATH,
    );


    /*
     * La fiche QR publique du produit utilise actuellement une lecture
     * dynamique des données.
     *
     * Nous revalidons malgré tout son chemin précis afin de rester
     * compatible avec une future évolution du cache.
     */

    revalidatePath(
      `/p/${archivedProduct.qrToken}`,
    );


    /* ----------------------------------------------------------------------
       6. SUCCÈS
       ---------------------------------------------------------------------- */

    return buildDeleteSuccessState(
      productId,
    );
  } catch {
    /* ----------------------------------------------------------------------
       7. ERREUR GÉNÉRIQUE
       ----------------------------------------------------------------------
       Aucune erreur Prisma, PostgreSQL, stack trace ou information
       infrastructure n'est envoyée au navigateur.
       ---------------------------------------------------------------------- */

    return buildDeleteErrorState(
      "Impossible de supprimer le produit pour le moment. Veuillez réessayer.",
    );
  }
}