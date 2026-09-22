import {
  ArrowRight,
  ImageIcon,
  PackageOpen,
} from "lucide-react";

import Link from "next/link";

import {
  gestionnaireRouteBuilders,
  routes,
} from "@/config/routes";

import type {
  DashboardTopProduct,
} from "@/server/gestionnaire/dashboard/dashboard";


/* ============================================================
   L&E COSMETICS EMPIRE
   DASHBOARD — PRODUITS LES PLUS VENDUS
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/dashboard/
   DashboardTopProducts.tsx

   RESPONSABILITÉS :

   - afficher les produits les plus vendus de la période ;
   - respecter l'ordre calculé côté serveur ;
   - afficher le rang réel ;
   - afficher l'image officielle du produit lorsqu'elle existe ;
   - afficher le nombre réel d'unités vendues ;
   - afficher le chiffre d'affaires généré ;
   - afficher la devise réelle ;
   - permettre l'ouverture de la fiche produit ;
   - gérer proprement l'absence de ventes.

   IMPORTANT :

   Ce composant :
   - ne fait aucune requête Prisma ;
   - ne reçoit aucun storeId ;
   - ne reçoit aucun managerId ;
   - ne recalcule aucun classement ;
   - n'invente aucun produit ;
   - n'utilise aucune image provenant d'Internet au hasard.

   Le classement provient de :

   src/server/gestionnaire/dashboard/dashboard.ts
   ============================================================ */


/* ============================================================
   PROPS
   ============================================================ */

type DashboardTopProductsProps =
  Readonly<{
    products:
      readonly DashboardTopProduct[];
  }>;


/* ============================================================
   FORMATTERS
   ============================================================ */

const INTEGER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


const AMOUNT_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        2,
    },
  );


/* ============================================================
   FORMAT UNITS
   ============================================================ */

function formatUnits(
  units:
    number,
): string {
  const safeUnits =
    Math.max(
      0,
      units,
    );


  return `${INTEGER_FORMATTER.format(
    safeUnits,
  )} unité${
    safeUnits >
    1
      ? "s"
      : ""
  }`;
}


/* ============================================================
   FORMAT REVENUE
   ------------------------------------------------------------
   Le code devise reste toujours visible.

   Exemples :

   3 720 000 XAF
   1 250 EUR
   900 USD
   ============================================================ */

function formatRevenue(
  revenue:
    number,

  currency:
    string,
): string {
  return `${AMOUNT_FORMATTER.format(
    revenue,
  )} ${currency}`;
}


/* ============================================================
   PRODUCT IMAGE
   ------------------------------------------------------------
   Les URL proviennent uniquement du catalogue réel.

   Si aucune image n'est disponible :
   placeholder interne propre.

   On utilise ici <img> volontairement car les images du catalogue
   peuvent provenir de domaines configurables.

   Cela évite de casser la page si un domaine distant n'est pas
   encore déclaré dans next.config.
   ============================================================ */

function ProductImage({
  product,
}: Readonly<{
  product:
    DashboardTopProduct;
}>) {
  if (
    !product.imageUrl
  ) {
    return (
      <div
        className="gestionnaire-dashboard-top-products__image-placeholder"
        aria-label={`Aucune image disponible pour ${product.name}`}
      >
        <ImageIcon
          size={22}
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </div>
    );
  }


  return (
    <div
      className="gestionnaire-dashboard-top-products__image-wrapper"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          product.imageUrl
        }
        alt={
          product.imageAlt ||
          product.name
        }
        className="gestionnaire-dashboard-top-products__image"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}


/* ============================================================
   PRODUCT ROW
   ============================================================ */

function TopProductRow({
  product,
  rank,
}: Readonly<{
  product:
    DashboardTopProduct;

  rank:
    number;
}>) {
  const productHref =
    gestionnaireRouteBuilders
      .productDetails(
        product.productId,
      );


  const units =
    formatUnits(
      product.unitsSold,
    );


  const revenue =
    formatRevenue(
      product.revenue,
      product.currency,
    );


  return (
    <article
      className="gestionnaire-dashboard-top-products__item"
    >
      {/* ======================================================
          RANK
          ====================================================== */}

      <div
        className="gestionnaire-dashboard-top-products__rank"
        aria-label={`Classement ${rank}`}
      >
        {rank}
      </div>


      {/* ======================================================
          PRODUCT IMAGE
          ====================================================== */}

      <Link
        href={
          productHref
        }
        className="gestionnaire-dashboard-top-products__image-link"
        aria-label={`Voir ${product.name}`}
      >
        <ProductImage
          product={
            product
          }
        />
      </Link>


      {/* ======================================================
          PRODUCT INFORMATION
          ====================================================== */}

      <div
        className="gestionnaire-dashboard-top-products__info"
      >
        <Link
          href={
            productHref
          }
          className="gestionnaire-dashboard-top-products__name"
        >
          {product.name}
        </Link>


        <div
          className="gestionnaire-dashboard-top-products__stats"
        >
          <span
            className="gestionnaire-dashboard-top-products__units"
          >
            {units} vendue
            {product.unitsSold >
            1
              ? "s"
              : ""}
          </span>

          <span
            className="gestionnaire-dashboard-top-products__separator"
            aria-hidden="true"
          >
            •
          </span>

          <span
            className="gestionnaire-dashboard-top-products__revenue"
          >
            {revenue}
          </span>
        </div>
      </div>


      {/* ======================================================
          OPEN PRODUCT
          ====================================================== */}

      <Link
        href={
          productHref
        }
        className="gestionnaire-dashboard-top-products__open"
        aria-label={`Ouvrir le produit ${product.name}`}
      >
        <ArrowRight
          size={17}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </Link>
    </article>
  );
}


/* ============================================================
   EMPTY STATE
   ============================================================ */

function TopProductsEmptyState() {
  return (
    <div
      className="gestionnaire-dashboard-top-products__empty"
      role="status"
    >
      <span
        className="gestionnaire-dashboard-top-products__empty-icon"
        aria-hidden="true"
      >
        <PackageOpen
          size={29}
          strokeWidth={1.6}
        />
      </span>

      <strong
        className="gestionnaire-dashboard-top-products__empty-title"
      >
        Aucun produit vendu
      </strong>

      <p
        className="gestionnaire-dashboard-top-products__empty-text"
      >
        Aucun produit n’a encore été vendu pour cette période.
      </p>
    </div>
  );
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function DashboardTopProducts({
  products,
}: DashboardTopProductsProps) {
  const hasProducts =
    products.length >
    0;


  return (
    <section
      className="gestionnaire-dashboard-top-products"
      aria-labelledby="gestionnaire-dashboard-top-products-title"
    >
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div
        className="gestionnaire-dashboard-top-products__header"
      >
        <div
          className="gestionnaire-dashboard-top-products__heading"
        >
          <h2
            id="gestionnaire-dashboard-top-products-title"
            className="gestionnaire-dashboard-top-products__title"
          >
            Produits les plus vendus
          </h2>

          <p
            className="gestionnaire-dashboard-top-products__subtitle"
          >
            Les meilleures ventes de la période sélectionnée.
          </p>
        </div>


        <Link
          href={
            routes
              .gestionnaire
              .products
          }
          className="gestionnaire-dashboard-top-products__view-all"
        >
          <span>
            Voir tout
          </span>

          <ArrowRight
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </Link>
      </div>


      {/* ======================================================
          CONTENT
          ====================================================== */}

      {hasProducts ? (
        <div
          className="gestionnaire-dashboard-top-products__list"
        >
          {products.map(
            (
              product,
              index,
            ) => (
              <TopProductRow
                key={
                  product
                    .storeProductId
                }
                product={
                  product
                }
                rank={
                  index +
                  1
                }
              />
            ),
          )}
        </div>
      ) : (
        <TopProductsEmptyState />
      )}


      {/* ======================================================
          ACCESSIBLE SUMMARY
          ====================================================== */}

      {hasProducts ? (
        <div
          className="gestionnaire-dashboard-top-products__sr-only"
        >
          <p>
            {`${products.length} produit${
              products.length >
              1
                ? "s"
                : ""
            } dans le classement des meilleures ventes.`}
          </p>

          {products.map(
            (
              product,
              index,
            ) => (
              <p
                key={
                  `accessible-${product.storeProductId}`
                }
              >
                {`Position ${
                  index +
                  1
                } : ${
                  product.name
                }, ${formatUnits(
                  product.unitsSold,
                )} vendues, chiffre d’affaires ${formatRevenue(
                  product.revenue,
                  product.currency,
                )}.`}
              </p>
            ),
          )}
        </div>
      ) : null}
    </section>
  );
}