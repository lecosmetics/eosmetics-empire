import styles from "./produits.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * LOADING — MES PRODUITS
 * ============================================================================
 *
 * Route :
 *
 * /gestionnaire/produits
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/produits/loading.tsx
 *
 * OBJECTIF :
 *
 * Afficher un Skeleton Loader fidèle à la vraie page pendant le chargement
 * des données serveur.
 *
 * Le loading reproduit :
 *
 * - le fil d'Ariane ;
 * - le titre ;
 * - la description ;
 * - le bouton Ajouter un produit ;
 * - les 4 KPI ;
 * - la carte Liste de mes produits ;
 * - la recherche ;
 * - les filtres ;
 * - plusieurs lignes du tableau.
 *
 * IMPORTANT :
 *
 * - aucun spinner géant ;
 * - aucune fausse donnée ;
 * - aucun faux produit ;
 * - aucun header recréé ;
 * - aucune sidebar recréée ;
 * - pleine largeur disponible après la sidebar ;
 * - compatible desktop et mobile ;
 * - aucune requête Prisma ici.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const KPI_SKELETON_COUNT =
  4;


const PRODUCT_ROW_SKELETON_COUNT =
  6;


/* ==========================================================================
   SKELETON BLOCK
   ========================================================================== */

function SkeletonBlock({
  className,
}: Readonly<{
  className?: string;
}>) {
  return (
    <div
      className={[
        styles.productsSkeletonBlock,
        className,
      ]
        .filter(
          Boolean,
        )
        .join(
          " ",
        )}
      aria-hidden="true"
    />
  );
}


/* ==========================================================================
   BREADCRUMB SKELETON
   ========================================================================== */

function BreadcrumbSkeleton() {
  return (
    <div
      className={
        styles.productsBreadcrumb
      }
      aria-hidden="true"
    >
      <SkeletonBlock
        className={
          styles.productsSkeletonBreadcrumbParent
        }
      />

      <span
        className={
          styles.productsBreadcrumbSeparator
        }
      >
        /
      </span>

      <SkeletonBlock
        className={
          styles.productsSkeletonBreadcrumbCurrent
        }
      />
    </div>
  );
}


/* ==========================================================================
   HEADER SKELETON
   ========================================================================== */

function HeaderSkeleton() {
  return (
    <div
      className={
        styles.productsSkeletonHeader
      }
      aria-hidden="true"
    >
      <div
        className={
          styles.productsSkeletonHeaderText
        }
      >
        <SkeletonBlock
          className={
            styles.productsSkeletonTitle
          }
        />

        <SkeletonBlock
          className={
            styles.productsSkeletonDescription
          }
        />
      </div>

      <SkeletonBlock
        className={
          styles.productsSkeletonButton
        }
      />
    </div>
  );
}


/* ==========================================================================
   KPI SKELETON
   ========================================================================== */

function KpiSkeleton() {
  return (
    <div
      className={
        styles.productsSkeletonKpi
      }
      aria-hidden="true"
    >
      <div
        className={
          styles.productsSkeletonKpiInner
        }
      >
        <SkeletonBlock
          className={
            styles.productsSkeletonKpiIcon
          }
        />

        <div
          className={
            styles.productsSkeletonKpiContent
          }
        >
          <SkeletonBlock
            className={
              styles.productsSkeletonKpiLabel
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonKpiValue
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonKpiHint
            }
          />
        </div>
      </div>
    </div>
  );
}


/* ==========================================================================
   FILTERS SKELETON
   ========================================================================== */

function FiltersSkeleton() {
  return (
    <div
      className={
        styles.productsSkeletonFiltersArea
      }
      aria-hidden="true"
    >
      <SkeletonBlock
        className={
          styles.productsSkeletonSearch
        }
      />

      <div
        className={
          styles.productsSkeletonFilterGrid
        }
      >
        <SkeletonBlock
          className={
            styles.productsSkeletonFilter
          }
        />

        <SkeletonBlock
          className={
            styles.productsSkeletonFilter
          }
        />

        <SkeletonBlock
          className={
            styles.productsSkeletonFilter
          }
        />
      </div>
    </div>
  );
}


/* ==========================================================================
   DESKTOP ROW SKELETON
   ========================================================================== */

function ProductRowSkeleton() {
  return (
    <div
      className={
        styles.productsSkeletonTableRow
      }
      aria-hidden="true"
    >
      {/* Checkbox */}

      <SkeletonBlock
        className={
          styles.productsSkeletonCheckbox
        }
      />


      {/* Product */}

      <div
        className={
          styles.productsSkeletonProduct
        }
      >
        <SkeletonBlock
          className={
            styles.productsSkeletonProductImage
          }
        />

        <div
          className={
            styles.productsSkeletonProductText
          }
        >
          <SkeletonBlock
            className={
              styles.productsSkeletonProductName
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonProductSku
            }
          />
        </div>
      </div>


      {/* Category */}

      <SkeletonBlock
        className={
          styles.productsSkeletonCellMedium
        }
      />


      {/* Price */}

      <SkeletonBlock
        className={
          styles.productsSkeletonCellSmall
        }
      />


      {/* Stock */}

      <SkeletonBlock
        className={
          styles.productsSkeletonCellSmall
        }
      />


      {/* Status */}

      <SkeletonBlock
        className={
          styles.productsSkeletonStatus
        }
      />


      {/* Date */}

      <SkeletonBlock
        className={
          styles.productsSkeletonCellMedium
        }
      />


      {/* Actions */}

      <div
        className={
          styles.productsSkeletonActions
        }
      >
        <SkeletonBlock
          className={
            styles.productsSkeletonAction
          }
        />

        <SkeletonBlock
          className={
            styles.productsSkeletonAction
          }
        />

        <SkeletonBlock
          className={
            styles.productsSkeletonAction
          }
        />
      </div>
    </div>
  );
}


/* ==========================================================================
   MOBILE PRODUCT CARD SKELETON
   ========================================================================== */

function MobileProductCardSkeleton() {
  return (
    <div
      className={
        styles.productsSkeletonMobileCard
      }
      aria-hidden="true"
    >
      <div
        className={
          styles.productsSkeletonMobileHeader
        }
      >
        <SkeletonBlock
          className={
            styles.productsSkeletonMobileImage
          }
        />

        <div
          className={
            styles.productsSkeletonMobileIdentity
          }
        >
          <SkeletonBlock
            className={
              styles.productsSkeletonMobileName
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonMobileSku
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonMobileStatus
            }
          />
        </div>
      </div>


      <div
        className={
          styles.productsSkeletonMobileDetails
        }
      >
        {Array.from({
          length:
            4,
        }).map(
          (
            _,
            index,
          ) => (
            <div
              key={
                `mobile-detail-${index}`
              }
              className={
                styles.productsSkeletonMobileDetail
              }
            >
              <SkeletonBlock
                className={
                  styles.productsSkeletonMobileDetailLabel
                }
              />

              <SkeletonBlock
                className={
                  styles.productsSkeletonMobileDetailValue
                }
              />
            </div>
          ),
        )}
      </div>


      <div
        className={
          styles.productsSkeletonMobileActions
        }
      >
        <SkeletonBlock
          className={
            styles.productsSkeletonMobileAction
          }
        />

        <SkeletonBlock
          className={
            styles.productsSkeletonMobileAction
          }
        />

        <SkeletonBlock
          className={
            styles.productsSkeletonMobileAction
          }
        />
      </div>
    </div>
  );
}


/* ==========================================================================
   LIST SKELETON
   ========================================================================== */

function ProductsListSkeleton() {
  return (
    <section
      className={
        styles.productsSkeletonListCard
      }
      aria-hidden="true"
    >
      {/* ================================================================
          CARD HEADER
          ================================================================ */}

      <div
        className={
          styles.productsSkeletonListHeader
        }
      >
        <div>
          <SkeletonBlock
            className={
              styles.productsSkeletonListTitle
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonListDescription
            }
          />
        </div>
      </div>


      {/* ================================================================
          FILTERS
          ================================================================ */}

      <FiltersSkeleton />


      {/* ================================================================
          DESKTOP TABLE
          ================================================================ */}

      <div
        className={
          styles.productsSkeletonDesktopTable
        }
      >
        <div
          className={
            styles.productsSkeletonTableHeader
          }
        >
          <SkeletonBlock
            className={
              styles.productsSkeletonCheckbox
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonHeaderProduct
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonHeaderCell
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonHeaderCell
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonHeaderCell
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonHeaderCell
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonHeaderCell
            }
          />

          <SkeletonBlock
            className={
              styles.productsSkeletonHeaderActions
            }
          />
        </div>


        {Array.from({
          length:
            PRODUCT_ROW_SKELETON_COUNT,
        }).map(
          (
            _,
            index,
          ) => (
            <ProductRowSkeleton
              key={
                `product-row-${index}`
              }
            />
          ),
        )}
      </div>


      {/* ================================================================
          MOBILE CARDS
          ================================================================ */}

      <div
        className={
          styles.productsSkeletonMobileList
        }
      >
        {Array.from({
          length:
            4,
        }).map(
          (
            _,
            index,
          ) => (
            <MobileProductCardSkeleton
              key={
                `mobile-product-${index}`
              }
            />
          ),
        )}
      </div>


      {/* ================================================================
          PAGINATION
          ================================================================ */}

      <div
        className={
          styles.productsSkeletonPagination
        }
      >
        <SkeletonBlock
          className={
            styles.productsSkeletonPaginationSummary
          }
        />

        <div
          className={
            styles.productsSkeletonPaginationButtons
          }
        >
          {Array.from({
            length:
              5,
          }).map(
            (
              _,
              index,
            ) => (
              <SkeletonBlock
                key={
                  `pagination-${index}`
                }
                className={
                  styles.productsSkeletonPaginationButton
                }
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default function GestionnaireProductsLoading() {
  return (
    <section
      className={
        styles.productsPage
      }
      aria-busy="true"
      aria-live="polite"
      aria-label="Chargement des produits"
    >
      <div
        className={
          styles.productsContent
        }
      >
        <span
          className={
            styles.productsLoadingAccessibleText
          }
        >
          Chargement de vos produits…
        </span>


        <div
          className={
            styles.productsSkeleton
          }
        >
          {/* ============================================================
              BREADCRUMB
              ============================================================ */}

          <BreadcrumbSkeleton />


          {/* ============================================================
              HEADER
              ============================================================ */}

          <HeaderSkeleton />


          {/* ============================================================
              KPI
              ============================================================ */}

          <div
            className={
              styles.productsSkeletonKpis
            }
            aria-hidden="true"
          >
            {Array.from({
              length:
                KPI_SKELETON_COUNT,
            }).map(
              (
                _,
                index,
              ) => (
                <KpiSkeleton
                  key={
                    `kpi-${index}`
                  }
                />
              ),
            )}
          </div>


          {/* ============================================================
              PRODUCT LIST
              ============================================================ */}

          <ProductsListSkeleton />
        </div>
      </div>
    </section>
  );
}