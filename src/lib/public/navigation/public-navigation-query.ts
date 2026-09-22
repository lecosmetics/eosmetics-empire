import "server-only";

import {
  ProductStatus,
  StoreProductStatus,
  StoreStatus,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  buildPublicCategoryNavigationHref,
  getEnabledPublicDesktopNavigation,
  getEnabledPublicHeaderActions,
  getEnabledPublicMobileBottomNavigation,
  getEnabledPublicMobileDrawerNavigation,
} from "@/config/public-navigation";

import {
  EMPTY_PUBLIC_NAVIGATION_BADGES,
  isPublicNavigationCategory,
  sortPublicNavigationByOrder,
  type PublicNavigationCategory,
  type PublicNavigationData,
} from "@/lib/public/navigation/public-navigation-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * NAVIGATION PUBLIQUE — QUERY SERVEUR
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/navigation/public-navigation-query.ts
 *
 *
 * RESPONSABILITÉS :
 *
 * - charger les catégories réellement disponibles dans PostgreSQL ;
 * - ne retourner que les catégories actives ;
 * - ne retourner que les catégories contenant au moins un produit public ;
 * - ne jamais exposer directement un modèle Prisma au navigateur ;
 * - construire les URLs publiques des catégories ;
 * - assembler la navigation desktop ;
 * - assembler le header public ;
 * - assembler le drawer mobile ;
 * - assembler les 5 boutons de navigation mobile ;
 * - fournir des compteurs vides tant qu'aucune vraie source métier
 *   panier / commandes / favoris n'est branchée ;
 * - rester utilisable même si la récupération des catégories échoue.
 *
 *
 * IMPORTANT :
 *
 * Ce fichier ne doit jamais :
 *
 * - inventer une catégorie ;
 * - inventer un compteur ;
 * - retourner un produit DRAFT ;
 * - retourner un produit ARCHIVED ;
 * - considérer un produit HIDDEN comme public ;
 * - considérer un produit ARCHIVED en boutique comme public ;
 * - afficher des produits provenant d'une boutique suspendue ;
 * - exposer storeId ;
 * - exposer managerId ;
 * - exposer des données privées.
 *
 * ============================================================================
 */


/* ==========================================================================
   LIMITES
   ========================================================================== */

/**
 * Sécurité défensive.
 *
 * Le menu public ne doit pas charger une quantité illimitée de catégories.
 *
 * Cette limite ne crée aucune donnée : elle protège seulement le shell
 * contre un volume anormal de résultats.
 */

const PUBLIC_NAVIGATION_CATEGORY_LIMIT =
  100;


/* ==========================================================================
   NORMALISATION TEXTE
   ========================================================================== */

function normalizePublicNavigationText(
  value:
    string,
): string {
  return value
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}


/* ==========================================================================
   NORMALISATION SLUG
   ========================================================================== */

function normalizePublicNavigationSlug(
  value:
    string,
): string {
  return value
    .trim()
    .replace(
      /^\/+|\/+$/g,
      "",
    );
}


/* ==========================================================================
   LOG D'ERREUR SÛR
   ========================================================================== */

/**
 * On ne journalise volontairement pas :
 *
 * - requête SQL ;
 * - données produit ;
 * - données boutique ;
 * - identifiants ;
 * - stack complète ;
 * - message Prisma détaillé.
 */

function logPublicNavigationQueryError(
  error:
    unknown,
): void {
  console.error(
    "[L&E Cosmetics Empire][PublicNavigation] Chargement des catégories impossible.",
    {
      errorName:
        error instanceof Error
          ? error.name
          : "UnknownError",
    },
  );
}


/* ==========================================================================
   CATÉGORIE DB -> DTO PUBLIC
   ========================================================================== */

function createPublicNavigationCategory(
  category:
    Readonly<{
      id:
        string;

      name:
        string;

      slug:
        string;
    }>,
): PublicNavigationCategory | null {
  const id =
    category.id.trim();


  const name =
    normalizePublicNavigationText(
      category.name,
    );


  const slug =
    normalizePublicNavigationSlug(
      category.slug,
    );


  if (
    !id ||
    !name ||
    !slug
  ) {
    return null;
  }


  const navigationCategory:
    PublicNavigationCategory = {
      id,

      name,

      slug,

      href:
        buildPublicCategoryNavigationHref(
          slug,
        ),
    };


  if (
    !isPublicNavigationCategory(
      navigationCategory,
    )
  ) {
    return null;
  }


  return navigationCategory;
}


/* ==========================================================================
   CATÉGORIES PUBLIQUES
   ========================================================================== */

/**
 * Retourne uniquement les catégories qui peuvent réellement servir
 * à la navigation publique.
 *
 *
 * Une catégorie doit :
 *
 * 1. être active ;
 *
 * 2. contenir au moins un Product ACTIVE ;
 *
 * 3. ce Product doit être commercialisé dans au moins une boutique ;
 *
 * 4. cette commercialisation doit être :
 *
 *    - ACTIVE ;
 *    - ou OUT_OF_STOCK.
 *
 * 5. la boutique correspondante doit être ACTIVE.
 *
 *
 * Pourquoi conserver OUT_OF_STOCK ?
 *
 * Le fonctionnement public existant autorise déjà l'affichage d'un produit
 * épuisé afin que la cliente puisse toujours consulter sa fiche.
 *
 * HIDDEN et ARCHIVED restent exclus.
 */

export async function getPublicNavigationCategories():
  Promise<PublicNavigationCategory[]> {
  try {
    const categories =
      await db.productCategory.findMany({
        where: {
          isActive:
            true,

          products: {
            some: {
              status:
                ProductStatus.ACTIVE,

              storeProducts: {
                some: {
                  status: {
                    in: [
                      StoreProductStatus.ACTIVE,
                      StoreProductStatus.OUT_OF_STOCK,
                    ],
                  },

                  store: {
                    status:
                      StoreStatus.ACTIVE,
                  },
                },
              },
            },
          },
        },

        select: {
          id:
            true,

          name:
            true,

          slug:
            true,
        },

        orderBy: [
          {
            name:
              "asc",
          },

          {
            id:
              "asc",
          },
        ],

        take:
          PUBLIC_NAVIGATION_CATEGORY_LIMIT,
      });


    const result:
      PublicNavigationCategory[] = [];


    const seenIds =
      new Set<string>();


    const seenSlugs =
      new Set<string>();


    for (
      const category
      of categories
    ) {
      const normalized =
        createPublicNavigationCategory(
          category,
        );


      if (
        !normalized
      ) {
        continue;
      }


      /**
       * Prisma garantit déjà normalement :
       *
       * - id unique ;
       * - slug unique.
       *
       * Cette protection supplémentaire empêche malgré tout un doublon
       * visuel si les données subissent une transformation inattendue.
       */

      if (
        seenIds.has(
          normalized.id,
        ) ||
        seenSlugs.has(
          normalized.slug,
        )
      ) {
        continue;
      }


      seenIds.add(
        normalized.id,
      );


      seenSlugs.add(
        normalized.slug,
      );


      result.push(
        normalized,
      );
    }


    return result;
  } catch (
    error
  ) {
    /**
     * Le catalogue de catégories ne doit pas faire tomber :
     *
     * - le logo ;
     * - la recherche ;
     * - le panier ;
     * - la navigation principale ;
     * - le footer ;
     * - toutes les pages publiques.
     *
     * En cas d'indisponibilité temporaire de PostgreSQL, le shell garde donc
     * sa navigation statique et n'affiche simplement aucune catégorie
     * dynamique.
     */

    logPublicNavigationQueryError(
      error,
    );


    return [];
  }
}


/* ==========================================================================
   NAVIGATION PUBLIQUE COMPLÈTE
   ========================================================================== */

/**
 * DTO principal du shell public.
 *
 * Ce résultat pourra être transmis directement aux composants :
 *
 * - PublicHeader ;
 * - PublicDesktopHeader ;
 * - PublicMobileHeader ;
 * - PublicMobileDrawer ;
 * - PublicMobileBottomNav ;
 * - PublicFooter si nécessaire.
 *
 *
 * Toutes les valeurs retournées ici sont sérialisables.
 */

export async function getPublicNavigationData():
  Promise<PublicNavigationData> {
  const categories =
    await getPublicNavigationCategories();


  const desktopNavigation =
    sortPublicNavigationByOrder(
      getEnabledPublicDesktopNavigation(),
    );


  const headerActions =
    sortPublicNavigationByOrder(
      getEnabledPublicHeaderActions(),
    );


  const mobileDrawer =
    sortPublicNavigationByOrder(
      getEnabledPublicMobileDrawerNavigation(),
    );


  const mobileBottomNavigation =
    sortPublicNavigationByOrder(
      getEnabledPublicMobileBottomNavigation(),
    );


  return {
    desktopNavigation,

    headerActions,

    mobileDrawer,

    mobileBottomNavigation,

    categories,

    /**
     * Aucun faux compteur.
     *
     * Ces valeurs resteront null jusqu'au branchement des vraies données :
     *
     * - panier cliente ;
     * - commandes cliente ;
     * - favoris cliente.
     */

    badges: {
      ...EMPTY_PUBLIC_NAVIGATION_BADGES,
    },
  };
}


/* ==========================================================================
   CATÉGORIES SEULEMENT — VERSION SÛRE
   ========================================================================== */

/**
 * Alias explicite utile pour les composants qui n'ont besoin que du menu
 * catégories et pas de toute la configuration du shell.
 */

export async function getPublicHeaderCategories():
  Promise<readonly PublicNavigationCategory[]> {
  return getPublicNavigationCategories();
}


/* ==========================================================================
   EMPTY NAVIGATION DATA
   ========================================================================== */

/**
 * Construction d'un shell valide sans accès base.
 *
 * Peut être utile :
 *
 * - pour certains tests ;
 * - pour un fallback serveur ;
 * - pour un Error Boundary futur ;
 * - pour une prévisualisation du shell.
 *
 *
 * IMPORTANT :
 *
 * Cette fonction ne crée aucune fausse catégorie et aucun faux compteur.
 */

export function createEmptyPublicNavigationData():
  PublicNavigationData {
  return {
    desktopNavigation:
      sortPublicNavigationByOrder(
        getEnabledPublicDesktopNavigation(),
      ),

    headerActions:
      sortPublicNavigationByOrder(
        getEnabledPublicHeaderActions(),
      ),

    mobileDrawer:
      sortPublicNavigationByOrder(
        getEnabledPublicMobileDrawerNavigation(),
      ),

    mobileBottomNavigation:
      sortPublicNavigationByOrder(
        getEnabledPublicMobileBottomNavigation(),
      ),

    categories:
      [],

    badges: {
      ...EMPTY_PUBLIC_NAVIGATION_BADGES,
    },
  };
}