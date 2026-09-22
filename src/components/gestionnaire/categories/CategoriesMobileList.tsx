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
 * src/components/gestionnaire/categories/CategoriesMobileList.tsx
 *
 * Route :
 *
 * /gestionnaire/categories
 *
 * RÔLE :
 *
 * Afficher la liste des catégories sur mobile sous forme de cartes.
 *
 * Chaque carte affiche uniquement :
 *
 * - image officielle ;
 * - nom ;
 * - description réelle si elle existe ;
 * - nombre de produits de la boutique connectée ;
 * - statut ;
 * - date d'ajout ;
 * - bouton Voir.
 *
 * ACTION UNIQUE :
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
 * - accepter un storeId ;
 * - accepter un managerId ;
 * - compter les produits lui-même ;
 * - créer une catégorie ;
 * - modifier une catégorie ;
 * - supprimer une catégorie ;
 * - inventer une image ;
 * - inventer une description ;
 * - inventer une date ;
 * - inventer un statut ;
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

export interface CategoriesMobileListProps {
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
   HELPERS — NORMALISATION
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
   HELPERS — PRODUITS
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


/* ==========================================================================
   HELPERS — DATE
   ========================================================================== */

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
  const parsedDate =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      parsedDate.getTime(),
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
        parsedDate,
      ),

    time:
      TIME_FORMATTER.format(
        parsedDate,
      ),
  };
}


/* ==========================================================================
   ROUTE — PRODUITS FILTRÉS
   ========================================================================== */

/**
 * Exemple :
 *
 * Soins du corps
 *
 * slug :
 *
 * soins-du-corps
 *
 * devient :
 *
 * /gestionnaire/produits?category=soins-du-corps
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

interface CategoryMobileImageProps {
  category:
    ManagerCategoryListItem;
}


function CategoryMobileImage({
  category,
}: CategoryMobileImageProps) {
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
          styles.categoryMobileImageFallback
        }
        aria-label={`Aucune image disponible pour ${category.name}`}
      >
        <ImageIcon
          size={28}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </div>
    );
  }


  return (
    <div
      className={
        styles.categoryMobileImageWrapper
      }
    >
      {/*
       * L'image utilisée est exactement celle enregistrée dans :
       *
       * ProductCategory.imageUrl
       *
       * Le fichier physique reste dans Supabase Storage.
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
          styles.categoryMobileImage
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

interface CategoryMobileDescriptionProps {
  description:
    string |
    null;
}


function CategoryMobileDescription({
  description,
}: CategoryMobileDescriptionProps) {
  const value =
    normalizeText(
      description,
    );


  if (
    !value
  ) {
    return null;
  }


  return (
    <p
      className={
        styles.categoryMobileDescription
      }
    >
      {value}
    </p>
  );
}


/* ==========================================================================
   STATUT
   ========================================================================== */

interface CategoryMobileStatusProps {
  isActive:
    boolean;
}


function CategoryMobileStatus({
  isActive,
}: CategoryMobileStatusProps) {
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
   CARTE MOBILE
   ========================================================================== */

interface CategoryMobileCardProps {
  category:
    ManagerCategoryListItem;

  rowNumber:
    number;
}


function CategoryMobileCard({
  category,
  rowNumber,
}: CategoryMobileCardProps) {
  const formattedDate =
    formatCategoryDate(
      category.createdAt,
    );


  return (
    <article
      className={
        styles.categoryMobileCard
      }
    >
      {/* ===================================================================
          IMAGE + IDENTITÉ
          =================================================================== */}

      <div
        className={
          styles.categoryMobileCardHeader
        }
      >
        <CategoryMobileImage
          category={
            category
          }
        />


        <div
          className={
            styles.categoryMobileIdentity
          }
        >
          <span
            className={
              styles.categoryMobileIndex
            }
            aria-label={`Catégorie numéro ${rowNumber}`}
          >
            #{rowNumber}
          </span>


          <h2
            className={
              styles.categoryMobileName
            }
          >
            {category.name}
          </h2>


          <CategoryMobileStatus
            isActive={
              category.isActive
            }
          />
        </div>
      </div>


      {/* ===================================================================
          DESCRIPTION
          =================================================================== */}

      <CategoryMobileDescription
        description={
          category.description
        }
      />


      {/* ===================================================================
          INFORMATIONS
          =================================================================== */}

      <dl
        className={
          styles.categoryMobileMeta
        }
      >
        <div
          className={
            styles.categoryMobileMetaItem
          }
        >
          <dt>
            Produits
          </dt>

          <dd>
            {formatProductCount(
              category.productCount,
            )}
          </dd>
        </div>


        <div
          className={
            styles.categoryMobileMetaItem
          }
        >
          <dt>
            Date d’ajout
          </dt>

          <dd>
            <span>
              {formattedDate.date}
            </span>

            {formattedDate.time ? (
              <span
                className={
                  styles.categoryMobileDateTime
                }
              >
                {formattedDate.time}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>


      {/* ===================================================================
          ACTION UNIQUE
          =================================================================== */}

      <div
        className={
          styles.categoryMobileActions
        }
      >
        <Link
          href={
            buildCategoryProductsHref(
              category.slug,
            )
          }
          className={
            styles.categoryMobileViewLink
          }
          aria-label={`Voir les produits de la catégorie ${category.name}`}
        >
          <Eye
            size={17}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span>
            Voir
          </span>
        </Link>
      </div>
    </article>
  );
}


/* ==========================================================================
   PAGINATION MOBILE
   ========================================================================== */

interface CategoriesMobilePaginationProps {
  filters:
    ManagerCategoriesFilters;

  pagination:
    ManagerCategoriesPagination;
}


function CategoriesMobilePagination({
  filters,
  pagination,
}: CategoriesMobilePaginationProps) {
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
        styles.categoriesMobilePagination
      }
    >
      <p
        className={
          styles.categoriesMobilePaginationSummary
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
            styles.categoriesMobilePaginationNavigation
          }
          aria-label="Pagination mobile des catégories"
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
                styles.categoriesMobilePaginationButton
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
                styles.categoriesMobilePaginationButton,
                styles.categoriesMobilePaginationButtonDisabled,
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
              styles.categoriesMobilePaginationCurrent
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
                styles.categoriesMobilePaginationButton
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
                styles.categoriesMobilePaginationButton,
                styles.categoriesMobilePaginationButtonDisabled,
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
            styles.categoriesMobilePaginationCurrent
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
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function CategoriesMobileList({
  categories,
  filters,
  pagination,
}: CategoriesMobileListProps) {
  if (
    categories.length ===
    0
  ) {
    return null;
  }


  return (
    <section
      className={
        styles.categoriesMobileSection
      }
      aria-label="Liste mobile des catégories"
    >
      <div
        className={
          styles.categoriesMobileList
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
              <CategoryMobileCard
                key={
                  category.id
                }
                category={
                  category
                }
                rowNumber={
                  rowNumber
                }
              />
            );
          },
        )}
      </div>


      <CategoriesMobilePagination
        filters={
          filters
        }
        pagination={
          pagination
        }
      />
    </section>
  );
}