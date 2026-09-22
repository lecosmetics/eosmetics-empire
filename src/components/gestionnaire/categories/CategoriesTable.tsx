import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageIcon,
} from "lucide-react";

import {
  routes,
} from "@/config/routes";

import {
  getManagerCategoryStatusLabel,
  type ManagerCategoriesFilters,
  type ManagerCategoriesPagination,
  type ManagerCategoryListItem,
} from "@/lib/gestionnaire/categories/category-types";

import styles from "@/app/gestionnaire/(espace-prive)/categories/categories.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CATÉGORIES
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/categories/CategoriesTable.tsx
 *
 * Route :
 *
 * /gestionnaire/categories
 *
 * RÔLE :
 *
 * Afficher la liste des catégories sur ordinateur sous forme de tableau.
 *
 * Colonnes :
 *
 * - numéro ;
 * - image ;
 * - nom ;
 * - description ;
 * - nombre de produits ;
 * - statut ;
 * - date d'ajout ;
 * - action.
 *
 * ACTION AUTORISÉE :
 *
 * Voir
 *
 * Le bouton Voir redirige vers :
 *
 * /gestionnaire/produits?category=<slug>
 *
 * IMPORTANT :
 *
 * Ce composant ne doit jamais :
 *
 * - effectuer de requête Prisma ;
 * - lire la session ;
 * - compter lui-même les produits ;
 * - accepter un storeId ;
 * - accepter un managerId ;
 * - modifier une catégorie ;
 * - supprimer une catégorie ;
 * - créer une catégorie ;
 * - inventer une image ;
 * - inventer une description ;
 * - inventer une date ;
 * - inventer un nombre de produits.
 *
 * Les données proviennent exclusivement de :
 *
 * src/lib/gestionnaire/categories/category-query.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface CategoriesTableProps {
  categories:
    readonly ManagerCategoryListItem[];

  filters:
    ManagerCategoriesFilters;

  pagination:
    ManagerCategoriesPagination;
}


/* ==========================================================================
   FORMATTERS
   ========================================================================== */

const NUMBER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


const DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    },
  );


const TIME_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );


/* ==========================================================================
   NORMALISATION
   ========================================================================== */

function normalizeText(
  value:
    string |
    null |
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


function normalizeCount(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }


  return Math.max(
    0,
    Math.trunc(
      value,
    ),
  );
}


/* ==========================================================================
   FORMATAGE
   ========================================================================== */

function formatProductCount(
  value:
    number,
): string {
  return NUMBER_FORMATTER.format(
    normalizeCount(
      value,
    ),
  );
}


interface FormattedCategoryDate {
  date:
    string;

  time:
    string;
}


function formatCategoryDate(
  value:
    string,
): FormattedCategoryDate {
  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return {
      date:
        "—",

      time:
        "",
    };
  }


  return {
    date:
      DATE_FORMATTER.format(
        date,
      ),

    time:
      TIME_FORMATTER.format(
        date,
      ),
  };
}


/* ==========================================================================
   ROUTE — PRODUITS FILTRÉS
   ========================================================================== */

/**
 * La catégorie est transmise par son slug.
 *
 * Exemple :
 *
 * Soins du corps
 *
 * devient :
 *
 * /gestionnaire/produits?category=soins-du-corps
 *
 * La page /gestionnaire/produits devra utiliser ce paramètre pour appliquer
 * réellement le filtre côté serveur.
 */

function buildCategoryProductsHref(
  categorySlug:
    string,
): string {
  const slug =
    normalizeText(
      categorySlug,
    );


  const searchParams =
    new URLSearchParams();


  searchParams.set(
    "category",
    slug,
  );


  return `${routes.gestionnaire.products}?${searchParams.toString()}`;
}


/* ==========================================================================
   ROUTE — PAGINATION
   ========================================================================== */

/**
 * Conserve la recherche et le statut lors d'un changement de page.
 *
 * Comme la pagination reste sur :
 *
 * /gestionnaire/categories
 *
 * seule la query string est nécessaire.
 */

function buildCategoriesPageHref(
  filters:
    ManagerCategoriesFilters,

  page:
    number,
): string {
  const searchParams =
    new URLSearchParams();


  const search =
    normalizeText(
      filters.q,
    );


  if (
    search
  ) {
    searchParams.set(
      "q",
      search,
    );
  }


  if (
    filters.status !==
    "all"
  ) {
    searchParams.set(
      "status",
      filters.status,
    );
  }


  searchParams.set(
    "page",
    String(
      Math.max(
        1,
        Math.trunc(
          page,
        ),
      ),
    ),
  );


  return `?${searchParams.toString()}`;
}


/* ==========================================================================
   IMAGE
   ========================================================================== */

interface CategoryImageProps {
  category:
    ManagerCategoryListItem;
}


function CategoryImage({
  category,
}: CategoryImageProps) {
  const imageUrl =
    normalizeText(
      category.imageUrl,
    );


  const imageAlt =
    normalizeText(
      category.imageAlt,
    ) ||
    category.name;


  if (
    !imageUrl
  ) {
    return (
      <div
        className={
          styles.categoryTableImageFallback
        }
        aria-label={`Aucune image disponible pour ${category.name}`}
      >
        <ImageIcon
          size={21}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </div>
    );
  }


  return (
    <div
      className={
        styles.categoryTableImageWrapper
      }
    >
      {/*
       * Les images des catégories sont actuellement gérées manuellement
       * dans Supabase Storage.
       *
       * On utilise ici l'URL réellement enregistrée dans imageUrl.
       *
       * eslint est désactivé uniquement pour cette image distante afin de
       * ne pas imposer ici une nouvelle configuration next/image avant
       * l'intégration du bucket category-images dans next.config.ts.
       */}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          imageUrl
        }
        alt={
          imageAlt
        }
        className={
          styles.categoryTableImage
        }
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}


/* ==========================================================================
   DESCRIPTION
   ========================================================================== */

interface CategoryDescriptionProps {
  description:
    string |
    null;
}


function CategoryDescription({
  description,
}: CategoryDescriptionProps) {
  const value =
    normalizeText(
      description,
    );


  if (
    !value
  ) {
    return (
      <span
        className={
          styles.categoryTableDescriptionEmpty
        }
      >
        —
      </span>
    );
  }


  return (
    <span
      className={
        styles.categoryTableDescription
      }
      title={
        value
      }
    >
      {value}
    </span>
  );
}


/* ==========================================================================
   STATUT
   ========================================================================== */

interface CategoryStatusBadgeProps {
  isActive:
    boolean;
}


function CategoryStatusBadge({
  isActive,
}: CategoryStatusBadgeProps) {
  const label =
    getManagerCategoryStatusLabel(
      isActive,
    );


  return (
    <span
      className={[
        styles.categoryStatusBadge,

        isActive
          ? styles.categoryStatusBadgeActive
          : styles.categoryStatusBadgeInactive,
      ].join(
        " ",
      )}
    >
      <span
        className={
          styles.categoryStatusDot
        }
        aria-hidden="true"
      />

      <span>
        {label}
      </span>
    </span>
  );
}


/* ==========================================================================
   DATE
   ========================================================================== */

interface CategoryDateProps {
  value:
    string;
}


function CategoryDate({
  value,
}: CategoryDateProps) {
  const formatted =
    formatCategoryDate(
      value,
    );


  return (
    <div
      className={
        styles.categoryTableDate
      }
    >
      <span
        className={
          styles.categoryTableDatePrimary
        }
      >
        {formatted.date}
      </span>


      {formatted.time ? (
        <span
          className={
            styles.categoryTableDateSecondary
          }
        >
          {formatted.time}
        </span>
      ) : null}
    </div>
  );
}


/* ==========================================================================
   ACTION VOIR
   ========================================================================== */

interface CategoryViewActionProps {
  category:
    ManagerCategoryListItem;
}


function CategoryViewAction({
  category,
}: CategoryViewActionProps) {
  return (
    <Link
      href={
        buildCategoryProductsHref(
          category.slug,
        )
      }
      className={
        styles.categoryViewLink
      }
      aria-label={`Voir les produits de la catégorie ${category.name}`}
    >
      <Eye
        size={16}
        strokeWidth={1.9}
        aria-hidden="true"
      />

      <span>
        Voir
      </span>
    </Link>
  );
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

interface CategoriesTablePaginationProps {
  filters:
    ManagerCategoriesFilters;

  pagination:
    ManagerCategoriesPagination;
}


function CategoriesTablePagination({
  filters,
  pagination,
}: CategoriesTablePaginationProps) {
  const {
    page,
    totalItems,
    totalPages,
    startItem,
    endItem,
    hasPreviousPage,
    hasNextPage,
  } =
    pagination;


  if (
    totalItems <=
    0
  ) {
    return null;
  }


  return (
    <div
      className={
        styles.categoriesTablePagination
      }
    >
      <p
        className={
          styles.categoriesTablePaginationSummary
        }
      >
        Affichage de{" "}
        <strong>
          {startItem}
        </strong>{" "}
        à{" "}
        <strong>
          {endItem}
        </strong>{" "}
        sur{" "}
        <strong>
          {totalItems}
        </strong>{" "}
        catégorie
        {totalItems > 1
          ? "s"
          : ""}
      </p>


      {totalPages > 1 ? (
        <nav
          className={
            styles.categoriesTablePaginationNavigation
          }
          aria-label="Pagination des catégories"
        >
          {hasPreviousPage ? (
            <Link
              href={
                buildCategoriesPageHref(
                  filters,
                  page - 1,
                )
              }
              className={
                styles.categoriesPaginationButton
              }
              aria-label="Afficher la page précédente des catégories"
            >
              <ChevronLeft
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span>
                Précédent
              </span>
            </Link>
          ) : (
            <span
              className={[
                styles.categoriesPaginationButton,
                styles.categoriesPaginationButtonDisabled,
              ].join(
                " ",
              )}
              aria-disabled="true"
            >
              <ChevronLeft
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span>
                Précédent
              </span>
            </span>
          )}


          <span
            className={
              styles.categoriesPaginationCurrent
            }
            aria-current="page"
          >
            {page}
          </span>


          {hasNextPage ? (
            <Link
              href={
                buildCategoriesPageHref(
                  filters,
                  page + 1,
                )
              }
              className={
                styles.categoriesPaginationButton
              }
              aria-label="Afficher la page suivante des catégories"
            >
              <span>
                Suivant
              </span>

              <ChevronRight
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </Link>
          ) : (
            <span
              className={[
                styles.categoriesPaginationButton,
                styles.categoriesPaginationButtonDisabled,
              ].join(
                " ",
              )}
              aria-disabled="true"
            >
              <span>
                Suivant
              </span>

              <ChevronRight
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </span>
          )}
        </nav>
      ) : (
        <span
          className={
            styles.categoriesPaginationCurrent
          }
          aria-label="Page 1 sur 1"
        >
          1
        </span>
      )}
    </div>
  );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function CategoriesTable({
  categories,
  filters,
  pagination,
}: CategoriesTableProps) {
  if (
    categories.length ===
    0
  ) {
    return null;
  }


  return (
    <div
      className={
        styles.categoriesDesktopTableSection
      }
    >
      <div
        className={
          styles.categoriesTableScroll
        }
      >
        <table
          className={
            styles.categoriesTable
          }
        >
          <caption
            className={
              styles.categoriesTableCaption
            }
          >
            Liste des catégories disponibles
          </caption>


          <thead
            className={
              styles.categoriesTableHead
            }
          >
            <tr>
              <th
                scope="col"
                className={
                  styles.categoriesTableNumberColumn
                }
              >
                #
              </th>


              <th
                scope="col"
                className={
                  styles.categoriesTableImageColumn
                }
              >
                Image
              </th>


              <th scope="col">
                Nom de la catégorie
              </th>


              <th scope="col">
                Description
              </th>


              <th
                scope="col"
                className={
                  styles.categoriesTableProductsColumn
                }
              >
                Nombre de produits
              </th>


              <th
                scope="col"
                className={
                  styles.categoriesTableStatusColumn
                }
              >
                Statut
              </th>


              <th
                scope="col"
                className={
                  styles.categoriesTableDateColumn
                }
              >
                Date d’ajout
              </th>


              <th
                scope="col"
                className={
                  styles.categoriesTableActionsColumn
                }
              >
                Actions
              </th>
            </tr>
          </thead>


          <tbody
            className={
              styles.categoriesTableBody
            }
          >
            {categories.map(
              (
                category,
                index,
              ) => {
                const rowNumber =
                  pagination.startItem >
                  0
                    ? pagination.startItem +
                      index
                    : index +
                      1;


                return (
                  <tr
                    key={
                      category.id
                    }
                  >
                    {/* =====================================================
                        NUMÉRO
                        ===================================================== */}

                    <td
                      className={
                        styles.categoryTableNumber
                      }
                    >
                      {rowNumber}
                    </td>


                    {/* =====================================================
                        IMAGE
                        ===================================================== */}

                    <td>
                      <CategoryImage
                        category={
                          category
                        }
                      />
                    </td>


                    {/* =====================================================
                        NOM
                        ===================================================== */}

                    <td>
                      <div
                        className={
                          styles.categoryTableNameCell
                        }
                      >
                        <span
                          className={
                            styles.categoryTableName
                          }
                        >
                          {category.name}
                        </span>
                      </div>
                    </td>


                    {/* =====================================================
                        DESCRIPTION
                        ===================================================== */}

                    <td>
                      <CategoryDescription
                        description={
                          category.description
                        }
                      />
                    </td>


                    {/* =====================================================
                        PRODUITS
                        ===================================================== */}

                    <td>
                      <span
                        className={
                          styles.categoryTableProductCount
                        }
                      >
                        {formatProductCount(
                          category.productCount,
                        )}
                      </span>
                    </td>


                    {/* =====================================================
                        STATUT
                        ===================================================== */}

                    <td>
                      <CategoryStatusBadge
                        isActive={
                          category.isActive
                        }
                      />
                    </td>


                    {/* =====================================================
                        DATE
                        ===================================================== */}

                    <td>
                      <CategoryDate
                        value={
                          category.createdAt
                        }
                      />
                    </td>


                    {/* =====================================================
                        ACTION UNIQUE
                        ===================================================== */}

                    <td>
                      <div
                        className={
                          styles.categoryTableActions
                        }
                      >
                        <CategoryViewAction
                          category={
                            category
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>


      <CategoriesTablePagination
        filters={
          filters
        }
        pagination={
          pagination
        }
      />
    </div>
  );
}