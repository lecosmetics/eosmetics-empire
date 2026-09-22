import Image from "next/image";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageOff,
  PackageOpen,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react";

import ProductDeleteButton from "@/components/gestionnaire/produits/list/ProductDeleteButton";

import type {
  GestionnaireProductDisplayStatus,
  GestionnaireProductListItem,
  GestionnaireProductStockState,
  GestionnaireProductsPagination,
  GestionnaireProductsQuery,
} from "@/server/gestionnaire/products/product-list-service";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * LISTE DES PRODUITS GESTIONNAIRE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/list/ProductsList.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher les produits réels de la boutique ;
 * - afficher le tableau desktop ;
 * - afficher les cards mobile ;
 * - afficher l'image principale ;
 * - afficher nom et SKU ;
 * - afficher catégorie ;
 * - afficher prix et devise ;
 * - afficher stock et état du stock ;
 * - afficher statut produit ;
 * - afficher date d'ajout ;
 * - fournir Voir / Modifier / Supprimer ;
 * - gérer l'Empty State ;
 * - gérer l'état "aucun résultat" ;
 * - afficher la pagination serveur ;
 * - conserver les filtres dans les liens de pagination.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne charge aucune donnée lui-même ;
 * - ne fait aucune requête Prisma ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - ne décide jamais du périmètre de sécurité.
 *
 * Les données reçues ont déjà été filtrées côté serveur par :
 *
 * getGestionnaireProductsListData()
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES
   ========================================================================== */

const GESTIONNAIRE_PRODUCTS_PATH =
  "/gestionnaire/produits";


const GESTIONNAIRE_ADD_PRODUCT_PATH =
  "/gestionnaire/produits/ajouter";


/* ==========================================================================
   PROPS
   ========================================================================== */

interface ProductsListProps {
  products:
    readonly GestionnaireProductListItem[];

  query:
    GestionnaireProductsQuery;

  pagination:
    GestionnaireProductsPagination;

  /**
   * Nombre réel total de produits de la boutique.
   *
   * Permet de distinguer :
   *
   * - boutique réellement vide ;
   * - recherche / filtre sans résultat.
   */
  totalProducts:
    number;
}


/* ==========================================================================
   PAGINATION ITEM
   ========================================================================== */

type PaginationItem =
  | number
  | "ellipsis-left"
  | "ellipsis-right";


/* ==========================================================================
   MONEY
   ========================================================================== */

function formatMoney(
  amount:
    string,

  currency:
    string,
): string {
  const numericAmount =
    Number(
      amount,
    );


  const normalizedCurrency =
    currency
      .trim()
      .toUpperCase();


  if (
    !Number.isFinite(
      numericAmount,
    )
  ) {
    return [
      amount,
      normalizedCurrency,
    ]
      .filter(
        Boolean,
      )
      .join(
        " ",
      );
  }


  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style:
          "currency",

        currency:
          normalizedCurrency,

        currencyDisplay:
          "code",

        maximumFractionDigits:
          2,
      },
    ).format(
      numericAmount,
    );
  } catch {
    return `${numericAmount.toLocaleString(
      "fr-FR",
      {
        maximumFractionDigits:
          2,
      },
    )} ${normalizedCurrency}`;
  }
}


/* ==========================================================================
   DATE
   --------------------------------------------------------------------------
   On affiche volontairement uniquement la date ici.

   Cela évite d'inventer un fuseau horaire différent de celui défini
   globalement par l'application.

   L'heure pourra être ajoutée ultérieurement si l'application possède
   un utilitaire officiel de timezone.
   ========================================================================== */

function formatProductDate(
  value:
    Date,
): string {
  try {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric",
      },
    ).format(
      value,
    );
  } catch {
    return "";
  }
}


/* ==========================================================================
   STATUS LABEL
   ========================================================================== */

function getProductStatusLabel(
  status:
    GestionnaireProductDisplayStatus,
): string {
  switch (
    status
  ) {
    case "PUBLISHED":
      return "Publié";

    case "DRAFT":
      return "Brouillon";

    case "INACTIVE":
    default:
      return "Inactif";
  }
}


/* ==========================================================================
   STATUS CLASS
   ========================================================================== */

function getProductStatusClassName(
  status:
    GestionnaireProductDisplayStatus,
): string {
  switch (
    status
  ) {
    case "PUBLISHED":
      return "productsListStatusPublished";

    case "DRAFT":
      return "productsListStatusDraft";

    case "INACTIVE":
    default:
      return "productsListStatusInactive";
  }
}


/* ==========================================================================
   STOCK LABEL
   ========================================================================== */

function getStockStateLabel(
  state:
    GestionnaireProductStockState,
): string {
  switch (
    state
  ) {
    case "LOW_STOCK":
      return "Stock faible";

    case "OUT_OF_STOCK":
      return "Rupture";

    case "IN_STOCK":
    default:
      return "En stock";
  }
}


/* ==========================================================================
   STOCK CLASS
   ========================================================================== */

function getStockStateClassName(
  state:
    GestionnaireProductStockState,
): string {
  switch (
    state
  ) {
    case "LOW_STOCK":
      return "productsListStockLow";

    case "OUT_OF_STOCK":
      return "productsListStockOut";

    case "IN_STOCK":
    default:
      return "productsListStockAvailable";
  }
}


/* ==========================================================================
   PRODUCT DETAIL HREF
   ========================================================================== */

function buildProductDetailHref(
  productId:
    string,
): string {
  return (
    `${GESTIONNAIRE_PRODUCTS_PATH}/${encodeURIComponent(
      productId,
    )}`
  );
}


/* ==========================================================================
   PRODUCT EDIT HREF
   --------------------------------------------------------------------------
   AUCUNE page /modifier ou /edit.

   Le même formulaire Ajouter un produit est réutilisé.
   ========================================================================== */

function buildProductEditHref(
  productId:
    string,
): string {
  const params =
    new URLSearchParams();


  params.set(
    "productId",
    productId,
  );


  return (
    `${GESTIONNAIRE_ADD_PRODUCT_PATH}?${params.toString()}`
  );
}


/* ==========================================================================
   PAGINATION HREF
   ========================================================================== */

function buildPaginationHref(
  query:
    GestionnaireProductsQuery,

  page:
    number,
): string {
  const params =
    new URLSearchParams();


  /* ------------------------------------------------------------------------
     SEARCH
     ------------------------------------------------------------------------ */

  if (
    query.q
  ) {
    params.set(
      "q",
      query.q,
    );
  }


  /* ------------------------------------------------------------------------
     STATUS
     ------------------------------------------------------------------------ */

  if (
    query.status !==
      "all"
  ) {
    params.set(
      "status",
      query.status,
    );
  }


  /* ------------------------------------------------------------------------
     CATEGORY
     ------------------------------------------------------------------------ */

  if (
    query.category
  ) {
    params.set(
      "category",
      query.category,
    );
  }


  /* ------------------------------------------------------------------------
     SORT
     ------------------------------------------------------------------------ */

  if (
    query.sort !==
      "newest"
  ) {
    params.set(
      "sort",
      query.sort,
    );
  }


  /* ------------------------------------------------------------------------
     PAGE
     ------------------------------------------------------------------------ */

  if (
    page >
      1
  ) {
    params.set(
      "page",
      String(
        page,
      ),
    );
  }


  const serialized =
    params.toString();


  return serialized
    ? `${GESTIONNAIRE_PRODUCTS_PATH}?${serialized}`
    : GESTIONNAIRE_PRODUCTS_PATH;
}


/* ==========================================================================
   PAGINATION ITEMS
   --------------------------------------------------------------------------
   Exemple :

   1 2 3 4 5

   ou :

   1 ... 4 5 6 ... 20

   On évite d'afficher 100 boutons si la boutique possède beaucoup
   de produits.
   ========================================================================== */

function buildPaginationItems(
  currentPage:
    number,

  totalPages:
    number,
): PaginationItem[] {
  if (
    totalPages <=
      7
  ) {
    return Array.from(
      {
        length:
          totalPages,
      },
      (
        _,
        index,
      ) =>
        index +
        1,
    );
  }


  const result:
    PaginationItem[] =
      [];


  /* ------------------------------------------------------------------------
     DÉBUT
     ------------------------------------------------------------------------ */

  if (
    currentPage <=
      4
  ) {
    result.push(
      1,
      2,
      3,
      4,
      5,
      "ellipsis-right",
      totalPages,
    );


    return result;
  }


  /* ------------------------------------------------------------------------
     FIN
     ------------------------------------------------------------------------ */

  if (
    currentPage >=
      totalPages -
        3
  ) {
    result.push(
      1,
      "ellipsis-left",
      totalPages -
        4,
      totalPages -
        3,
      totalPages -
        2,
      totalPages -
        1,
      totalPages,
    );


    return result;
  }


  /* ------------------------------------------------------------------------
     MILIEU
     ------------------------------------------------------------------------ */

  result.push(
    1,
    "ellipsis-left",
    currentPage -
      1,
    currentPage,
    currentPage +
      1,
    "ellipsis-right",
    totalPages,
  );


  return result;
}


/* ==========================================================================
   PRODUCT IMAGE
   ========================================================================== */

function ProductThumbnail({
  product,
}: Readonly<{
  product:
    GestionnaireProductListItem;
}>) {
  if (
    !product.image
  ) {
    return (
      <div
        className="productsListProductImagePlaceholder"
        aria-label={`Aucune image pour ${product.name}`}
      >
        <ImageOff
          size={20}
          strokeWidth={1.6}
          aria-hidden="true"
        />
      </div>
    );
  }


  return (
    <div className="productsListProductImage">
      <Image
        src={
          product.image.url
        }
        alt={
          product.image
            .altText
            ?.trim() ||
          product.name
        }
        fill
        sizes="64px"
        className="productsListProductImageElement"
      />
    </div>
  );
}


/* ==========================================================================
   PRODUCT STATUS BADGE
   ========================================================================== */

function ProductStatusBadge({
  status,
}: Readonly<{
  status:
    GestionnaireProductDisplayStatus;
}>) {
  return (
    <span
      className={[
        "productsListStatus",
        getProductStatusClassName(
          status,
        ),
      ]
        .filter(
          Boolean,
        )
        .join(
          " ",
        )}
    >
      <span
        className="productsListStatusDot"
        aria-hidden="true"
      />

      <span>
        {getProductStatusLabel(
          status,
        )}
      </span>
    </span>
  );
}


/* ==========================================================================
   STOCK
   ========================================================================== */

function ProductStock({
  product,
}: Readonly<{
  product:
    GestionnaireProductListItem;
}>) {
  const {
    quantity,
    state,
  } =
    product.inventory;


  return (
    <div className="productsListStock">
      <strong>
        {quantity.toLocaleString(
          "fr-FR",
        )}
      </strong>

      <span
        className={[
          "productsListStockState",
          getStockStateClassName(
            state,
          ),
        ]
          .filter(
            Boolean,
          )
          .join(
            " ",
          )}
      >
        {getStockStateLabel(
          state,
        )}
      </span>
    </div>
  );
}


/* ==========================================================================
   ACTIONS
   ========================================================================== */

function ProductActions({
  product,
}: Readonly<{
  product:
    GestionnaireProductListItem;
}>) {
  const detailHref =
    buildProductDetailHref(
      product.productId,
    );


  const editHref =
    buildProductEditHref(
      product.productId,
    );


  return (
    <div className="productsListActions">
      {/* ----------------------------------------------------------------
          VOIR
          ---------------------------------------------------------------- */}

      <Link
        href={
          detailHref
        }
        className="productsListActionButton productsListActionView"
        aria-label={`Voir ${product.name}`}
      >
        <Eye
          size={15}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        <span>
          Voir le produit
        </span>
      </Link>


      {/* ----------------------------------------------------------------
          MODIFIER
          ----------------------------------------------------------------
          Réutilise obligatoirement la page Ajouter un produit.
          ---------------------------------------------------------------- */}

      <Link
        href={
          editHref
        }
        className="productsListActionButton productsListActionEdit"
        aria-label={`Modifier ${product.name}`}
      >
        <Pencil
          size={15}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        <span>
          Modifier
        </span>
      </Link>


      {/* ----------------------------------------------------------------
          SUPPRIMER
          ---------------------------------------------------------------- */}

      <ProductDeleteButton
        productId={
          product.productId
        }
        productName={
          product.name
        }
      />
    </div>
  );
}


/* ==========================================================================
   EMPTY STATE — AUCUN PRODUIT
   ========================================================================== */

function ProductsEmptyState() {
  return (
    <div className="productsListEmptyState">
      <div className="productsListEmptyIcon">
        <PackageOpen
          size={30}
          strokeWidth={1.55}
          aria-hidden="true"
        />
      </div>


      <div className="productsListEmptyContent">
        <h3>
          Aucun produit pour le moment
        </h3>

        <p>
          Ajoutez votre premier produit pour commencer à le proposer
          dans votre boutique.
        </p>
      </div>


      <Link
        href={
          GESTIONNAIRE_ADD_PRODUCT_PATH
        }
        className="productsListEmptyButton"
      >
        <Plus
          size={16}
          strokeWidth={2}
          aria-hidden="true"
        />

        <span>
          Ajouter un produit
        </span>
      </Link>
    </div>
  );
}


/* ==========================================================================
   EMPTY FILTER RESULT
   ========================================================================== */

function ProductsNoResultState() {
  return (
    <div className="productsListEmptyState productsListNoResultState">
      <div className="productsListEmptyIcon">
        <PackageOpen
          size={30}
          strokeWidth={1.55}
          aria-hidden="true"
        />
      </div>


      <div className="productsListEmptyContent">
        <h3>
          Aucun produit ne correspond à votre recherche
        </h3>

        <p>
          Modifiez vos critères ou réinitialisez les filtres pour
          afficher à nouveau vos produits.
        </p>
      </div>


      <Link
        href={
          GESTIONNAIRE_PRODUCTS_PATH
        }
        className="productsListResetButton"
      >
        <RotateCcw
          size={15}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        <span>
          Réinitialiser les filtres
        </span>
      </Link>
    </div>
  );
}


/* ==========================================================================
   DESKTOP TABLE
   ========================================================================== */

function ProductsDesktopTable({
  products,
}: Readonly<{
  products:
    readonly GestionnaireProductListItem[];
}>) {
  return (
    <div className="productsListDesktopTableWrapper">
      <table className="productsListTable">
        <thead>
          <tr>
            {/* ----------------------------------------------------------
                SÉLECTION
                ----------------------------------------------------------
                Conservée pour respecter l'architecture visuelle.

                Aucune action groupée n'est inventée à ce stade.
                ---------------------------------------------------------- */}

            <th
              className="productsListSelectionColumn"
              scope="col"
            >
              <span className="productsListVisuallyHidden">
                Sélection
              </span>

              <input
                type="checkbox"
                className="productsListCheckbox"
                disabled
                aria-label="Sélection groupée non disponible"
              />
            </th>


            <th scope="col">
              Produit
            </th>

            <th scope="col">
              Catégorie
            </th>

            <th scope="col">
              Prix
            </th>

            <th scope="col">
              Stock
            </th>

            <th scope="col">
              Statut
            </th>

            <th scope="col">
              Date d’ajout
            </th>

            <th
              scope="col"
              className="productsListActionsColumn"
            >
              Actions
            </th>
          </tr>
        </thead>


        <tbody>
          {products.map(
            (
              product,
            ) => {
              const formattedDate =
                formatProductDate(
                  product.createdAt,
                );


              return (
                <tr
                  key={
                    product.storeProductId
                  }
                >
                  {/* ----------------------------------------------------
                      SELECT
                      ---------------------------------------------------- */}

                  <td className="productsListSelectionColumn">
                    <input
                      type="checkbox"
                      className="productsListCheckbox"
                      aria-label={`Sélectionner ${product.name}`}
                    />
                  </td>


                  {/* ----------------------------------------------------
                      PRODUCT
                      ---------------------------------------------------- */}

                  <td>
                    <div className="productsListProductCell">
                      <ProductThumbnail
                        product={
                          product
                        }
                      />


                      <div className="productsListProductIdentity">
                        <Link
                          href={
                            buildProductDetailHref(
                              product.productId,
                            )
                          }
                          className="productsListProductName"
                        >
                          {product.name}
                        </Link>


                        <span className="productsListProductSku">
                          SKU : {product.sku}
                        </span>
                      </div>
                    </div>
                  </td>


                  {/* ----------------------------------------------------
                      CATEGORY
                      ---------------------------------------------------- */}

                  <td>
                    <span className="productsListCategory">
                      {product.category
                        ?.name ??
                        "Non classé"}
                    </span>
                  </td>


                  {/* ----------------------------------------------------
                      PRICE
                      ---------------------------------------------------- */}

                  <td>
                    <strong className="productsListPrice">
                      {formatMoney(
                        product.pricing
                          .amount,
                        product.pricing
                          .currency,
                      )}
                    </strong>
                  </td>


                  {/* ----------------------------------------------------
                      STOCK
                      ---------------------------------------------------- */}

                  <td>
                    <ProductStock
                      product={
                        product
                      }
                    />
                  </td>


                  {/* ----------------------------------------------------
                      STATUS
                      ---------------------------------------------------- */}

                  <td>
                    <ProductStatusBadge
                      status={
                        product.status
                      }
                    />
                  </td>


                  {/* ----------------------------------------------------
                      DATE
                      ---------------------------------------------------- */}

                  <td>
                    <span className="productsListDate">
                      {formattedDate ||
                        "—"}
                    </span>
                  </td>


                  {/* ----------------------------------------------------
                      ACTIONS
                      ---------------------------------------------------- */}

                  <td className="productsListActionsColumn">
                    <ProductActions
                      product={
                        product
                      }
                    />
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
}


/* ==========================================================================
   MOBILE CARD
   ========================================================================== */

function ProductMobileCard({
  product,
}: Readonly<{
  product:
    GestionnaireProductListItem;
}>) {
  const formattedDate =
    formatProductDate(
      product.createdAt,
    );


  return (
    <article className="productsListMobileCard">
      {/* ================================================================
          HEADER
          ================================================================ */}

      <div className="productsListMobileHeader">
        <ProductThumbnail
          product={
            product
          }
        />


        <div className="productsListMobileIdentity">
          <Link
            href={
              buildProductDetailHref(
                product.productId,
              )
            }
            className="productsListProductName"
          >
            {product.name}
          </Link>


          <span className="productsListProductSku">
            SKU : {product.sku}
          </span>


          <ProductStatusBadge
            status={
              product.status
            }
          />
        </div>
      </div>


      {/* ================================================================
          INFORMATIONS
          ================================================================ */}

      <dl className="productsListMobileDetails">
        <div className="productsListMobileDetail">
          <dt>
            Catégorie
          </dt>

          <dd>
            {product.category
              ?.name ??
              "Non classé"}
          </dd>
        </div>


        <div className="productsListMobileDetail">
          <dt>
            Prix
          </dt>

          <dd className="productsListMobilePrice">
            {formatMoney(
              product.pricing
                .amount,
              product.pricing
                .currency,
            )}
          </dd>
        </div>


        <div className="productsListMobileDetail">
          <dt>
            Stock
          </dt>

          <dd>
            <ProductStock
              product={
                product
              }
            />
          </dd>
        </div>


        <div className="productsListMobileDetail">
          <dt>
            Date d’ajout
          </dt>

          <dd>
            {formattedDate ||
              "—"}
          </dd>
        </div>
      </dl>


      {/* ================================================================
          ACTIONS
          ================================================================ */}

      <div className="productsListMobileActions">
        <ProductActions
          product={
            product
          }
        />
      </div>
    </article>
  );
}


/* ==========================================================================
   MOBILE LIST
   ========================================================================== */

function ProductsMobileList({
  products,
}: Readonly<{
  products:
    readonly GestionnaireProductListItem[];
}>) {
  return (
    <div className="productsListMobile">
      {products.map(
        (
          product,
        ) => (
          <ProductMobileCard
            key={
              product.storeProductId
            }
            product={
              product
            }
          />
        ),
      )}
    </div>
  );
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

function ProductsPagination({
  query,
  pagination,
}: Readonly<{
  query:
    GestionnaireProductsQuery;

  pagination:
    GestionnaireProductsPagination;
}>) {
  const paginationItems =
    buildPaginationItems(
      pagination.page,
      pagination.totalPages,
    );


  return (
    <div className="productsListPagination">
      {/* ================================================================
          SUMMARY
          ================================================================ */}

      <p className="productsListPaginationSummary">
        {pagination.totalItems >
          0 ? (
          <>
            Affichage de{" "}
            <strong>
              {pagination.from}
            </strong>{" "}
            à{" "}
            <strong>
              {pagination.to}
            </strong>{" "}
            sur{" "}
            <strong>
              {pagination.totalItems}
            </strong>{" "}
            produit
            {pagination.totalItems >
              1
              ? "s"
              : ""}
          </>
        ) : (
          <>
            Aucun produit à afficher
          </>
        )}
      </p>


      {/* ================================================================
          CONTROLS
          ================================================================ */}

      {pagination.totalPages >
        1 ? (
        <nav
          className="productsListPaginationControls"
          aria-label="Pagination des produits"
        >
          {/* ------------------------------------------------------------
              PREVIOUS
              ------------------------------------------------------------ */}

          {pagination.hasPreviousPage ? (
            <Link
              href={
                buildPaginationHref(
                  query,
                  pagination.page -
                    1,
                )
              }
              className="productsListPaginationButton"
              aria-label="Page précédente"
              scroll={
                false
              }
            >
              <ChevronLeft
                size={16}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </Link>
          ) : (
            <span
              className="productsListPaginationButton productsListPaginationButtonDisabled"
              aria-hidden="true"
            >
              <ChevronLeft
                size={16}
                strokeWidth={1.9}
              />
            </span>
          )}


          {/* ------------------------------------------------------------
              PAGES
              ------------------------------------------------------------ */}

          {paginationItems.map(
            (
              item,
              index,
            ) => {
              if (
                item ===
                  "ellipsis-left" ||
                item ===
                  "ellipsis-right"
              ) {
                return (
                  <span
                    key={`${item}-${index}`}
                    className="productsListPaginationEllipsis"
                    aria-hidden="true"
                  >
                    …
                  </span>
                );
              }


              const isCurrent =
                item ===
                pagination.page;


              if (
                isCurrent
              ) {
                return (
                  <span
                    key={
                      item
                    }
                    className="productsListPaginationButton productsListPaginationButtonActive"
                    aria-current="page"
                  >
                    {item}
                  </span>
                );
              }


              return (
                <Link
                  key={
                    item
                  }
                  href={
                    buildPaginationHref(
                      query,
                      item,
                    )
                  }
                  className="productsListPaginationButton"
                  aria-label={`Page ${item}`}
                  scroll={
                    false
                  }
                >
                  {item}
                </Link>
              );
            },
          )}


          {/* ------------------------------------------------------------
              NEXT
              ------------------------------------------------------------ */}

          {pagination.hasNextPage ? (
            <Link
              href={
                buildPaginationHref(
                  query,
                  pagination.page +
                    1,
                )
              }
              className="productsListPaginationButton"
              aria-label="Page suivante"
              scroll={
                false
              }
            >
              <ChevronRight
                size={16}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </Link>
          ) : (
            <span
              className="productsListPaginationButton productsListPaginationButtonDisabled"
              aria-hidden="true"
            >
              <ChevronRight
                size={16}
                strokeWidth={1.9}
              />
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}


/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function ProductsList({
  products,
  query,
  pagination,
  totalProducts,
}: ProductsListProps) {
  /* ------------------------------------------------------------------------
     AUCUN PRODUIT DANS LA BOUTIQUE
     ------------------------------------------------------------------------ */

  if (
    totalProducts ===
      0
  ) {
    return (
      <ProductsEmptyState />
    );
  }


  /* ------------------------------------------------------------------------
     AUCUN RÉSULTAT APRÈS FILTRES
     ------------------------------------------------------------------------ */

  if (
    products.length ===
      0
  ) {
    return (
      <>
        <ProductsNoResultState />


        <ProductsPagination
          query={
            query
          }
          pagination={
            pagination
          }
        />
      </>
    );
  }


  /* ------------------------------------------------------------------------
     LISTE
     ------------------------------------------------------------------------ */

  return (
    <>
      {/* ================================================================
          DESKTOP
          ================================================================ */}

      <ProductsDesktopTable
        products={
          products
        }
      />


      {/* ================================================================
          MOBILE
          ================================================================ */}

      <ProductsMobileList
        products={
          products
        }
      />


      {/* ================================================================
          PAGINATION
          ================================================================ */}

      <ProductsPagination
        query={
          query
        }
        pagination={
          pagination
        }
      />
    </>
  );
}