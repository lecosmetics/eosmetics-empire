import type {
  Metadata,
} from "next";

import PublicSuccessPage from "@/components/public/commande/PublicSuccessPage";

import {
  getPublicSuccessData,
} from "@/lib/public/commande/public-success-query";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE PUBLIQUE — SUCCÈS COMMANDE
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/commande/succes/page.tsx
 *
 * Route :
 *
 * /commande/succes
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * - récupérer l'identifiant de commande transmis à la page ;
 * - ne jamais considérer l'URL comme une preuve de succès ;
 * - demander au serveur de relire la vraie commande PostgreSQL ;
 * - récupérer son véritable état ;
 * - transmettre uniquement le résultat serveur à PublicSuccessPage ;
 * - laisser le shell public existant gérer :
 *
 *   - PublicHeader ;
 *   - navigation desktop ;
 *   - PublicFooter desktop ;
 *   - PublicMobileBottomNav mobile.
 *
 * ============================================================================
 *
 * ARCHITECTURE :
 *
 * URL
 *
 *      ↓
 *
 * orderId
 *
 *      ↓
 *
 * public-success-query.ts
 *
 *      ↓
 *
 * PostgreSQL
 *
 *      ↓
 *
 * PublicSuccessQueryResult
 *
 *      ↓
 *
 * PublicSuccessPage.tsx
 *
 * ============================================================================
 *
 * SÉCURITÉ :
 *
 * CETTE PAGE NE DOIT JAMAIS :
 *
 * - lire un prix depuis searchParams ;
 * - lire un total depuis searchParams ;
 * - lire un statut de paiement depuis searchParams ;
 * - considérer ?success=true comme fiable ;
 * - considérer ?paid=true comme fiable ;
 * - considérer le simple accès à cette URL comme une confirmation ;
 * - écrire dans Order ;
 * - écrire dans Payment ;
 * - écrire dans Receipt ;
 * - écrire dans Shipment ;
 * - générer un reçu ;
 * - envoyer un e-mail ;
 * - modifier le stock ;
 * - recréer le shell public.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. RENDU TOUJOURS DYNAMIQUE
   ========================================================================== */

/**
 * L'état d'une commande peut évoluer :
 *
 * PENDING
 *      ↓
 * CONFIRMED
 *      ↓
 * PROCESSING
 *      ↓
 * SHIPPED
 *      ↓
 * DELIVERED
 *
 * Le paiement peut également évoluer après création.
 *
 * La page ne doit donc pas être figée par un rendu statique.
 */
export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/* ==========================================================================
   2. METADATA
   ========================================================================== */

/**
 * Aucun numéro de commande ni aucune donnée cliente
 * n'est placé dans les metadata.
 *
 * La page de confirmation ne doit pas être indexée
 * par les moteurs de recherche.
 */
export const metadata:
  Metadata = {
    title:
      "Confirmation de commande | L&E Cosmetics Empire",

    description:
      "Consultez l’état réel de votre commande L&E Cosmetics Empire.",

    robots: {
      index:
        false,

      follow:
        false,

      nocache:
        true,

      googleBot: {
        index:
          false,

        follow:
          false,

        noimageindex:
          true,
      },
    },
  };


/* ==========================================================================
   3. SEARCH PARAMS
   ========================================================================== */

type PublicSuccessSearchParams =
  Readonly<
    Record<
      string,
      string |
      string[] |
      undefined
    >
  >;


interface PublicSuccessRoutePageProps {
  readonly searchParams:
    Promise<
      PublicSuccessSearchParams
    >;
}


/* ==========================================================================
   4. PARAMÈTRE ORDER ID
   ========================================================================== */

const PUBLIC_SUCCESS_ORDER_ID_QUERY_KEY =
  "orderId" as const;


/* ==========================================================================
   5. NORMALISATION D'UN PARAMÈTRE UNIQUE
   ========================================================================== */

/**
 * Une commande ne doit jamais être choisie arbitrairement
 * lorsqu'un paramètre apparaît plusieurs fois :
 *
 * ?orderId=A&orderId=B
 *
 * Dans ce cas, la valeur est volontairement rejetée.
 */
function readSingleSearchParam(
  value:
    string |
    string[] |
    undefined,
): string {
  if (
    typeof value !==
      "string"
  ) {
    return "";
  }


  return value.trim();
}


/* ==========================================================================
   6. PAGE
   ========================================================================== */

export default async function CommandeSuccessPage({
  searchParams,
}: PublicSuccessRoutePageProps) {
  /**
   * Next.js App Router récent fournit searchParams
   * sous forme de Promise dans les Server Components.
   */
  const resolvedSearchParams =
    await searchParams;


  /**
   * Seul orderId est lu depuis l'URL.
   *
   * IMPORTANT :
   *
   * Cet identifiant sert uniquement à demander au serveur
   * quelle commande relire.
   *
   * Toutes les données métier restent relues depuis PostgreSQL.
   */
  const orderId =
    readSingleSearchParam(
      resolvedSearchParams[
        PUBLIC_SUCCESS_ORDER_ID_QUERY_KEY
      ],
    );


  /**
   * Même en cas d'identifiant absent ou invalide,
   * on passe par la query centrale.
   *
   * Elle est responsable de retourner :
   *
   * INVALID_ORDER_ID
   *
   * plutôt que de lancer une requête Prisma dangereuse
   * ou de fabriquer une commande.
   */
  const result =
    await getPublicSuccessData(
      orderId,
    );


  return (
    <PublicSuccessPage
      result={result}
    />
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * URL ATTENDUE :
 *
 * /commande/succes?orderId=<identifiant-réel>
 *
 * ============================================================================
 *
 * DONNÉES AUTORISÉES DEPUIS L'URL :
 *
 * orderId
 *
 * ============================================================================
 *
 * DONNÉES INTERDITES COMME SOURCE DE VÉRITÉ :
 *
 * price
 * subtotal
 * shippingAmount
 * discountAmount
 * totalAmount
 * currency
 * paymentStatus
 * orderStatus
 * receiptNumber
 * paid
 * success
 *
 * ============================================================================
 *
 * SOURCE DE VÉRITÉ :
 *
 * PostgreSQL
 *
 * via :
 *
 * src/lib/public/commande/public-success-query.ts
 *
 * ============================================================================
 *
 * AFFICHAGE :
 *
 * src/components/public/commande/PublicSuccessPage.tsx
 *
 * ============================================================================
 *
 * STYLE :
 *
 * src/components/public/commande/public-success.module.css
 *
 * ============================================================================
 *
 * SHELL :
 *
 * src/app/(public)/layout.tsx
 *
 * ============================================================================
 */