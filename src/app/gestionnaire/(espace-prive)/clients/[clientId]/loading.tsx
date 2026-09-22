import styles from "../clients.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — DÉTAIL CLIENT — LOADING
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/clients/[clientId]/loading.tsx
 *
 * Route :
 *
 * /gestionnaire/clients/[clientId]
 *
 * RÔLE :
 *
 * Afficher un état de chargement propre pendant la récupération sécurisée
 * du détail d'un client.
 *
 * IMPORTANT :
 *
 * - aucune donnée fictive ;
 * - aucun faux nom ;
 * - aucun faux montant ;
 * - aucune fausse adresse ;
 * - aucune fausse commande ;
 * - aucun storeId ;
 * - aucun managerId ;
 * - aucune requête Prisma ;
 * - aucun nouveau shell ;
 * - aucune nouvelle sidebar ;
 * - aucun nouveau header global ;
 * - aucun <main> imbriqué ;
 * - pleine largeur dans le Main Gestionnaire existant.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const DETAIL_KPI_COUNT =
  4;


const INFO_ROW_COUNT =
  6;


const ADDRESS_SKELETON_COUNT =
  2;


const ORDER_SKELETON_COUNT =
  6;


/* ==========================================================================
   UTILITAIRE
   ========================================================================== */

function createSkeletonItems(
  count:
    number,
): readonly number[] {
  return Array.from(
    {
      length:
        count,
    },
    (
      _value,
      index,
    ) =>
      index,
  );
}


/* ==========================================================================
   PETITS BLOCS INTERNES
   ========================================================================== */

function SkeletonBlock({
  className,
}: {
  readonly className:
    string;
}) {
  return (
    <div
      className={[
        styles.clientsLoadingRow,
        className,
      ].join(" ")}
    />
  );
}


/* ==========================================================================
   PAGE LOADING
   ========================================================================== */

export default function ClientDetailLoading() {
  return (
    <div
      className={
        styles.clientsPage
      }
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className={
          styles.clientsContent
        }
      >
        {/* ================================================================
            TEXTE ACCESSIBLE
            ================================================================ */}

        <span
          className={
            styles.clientsVisuallyHidden
          }
        >
          Chargement des informations du client.
        </span>


        {/* ================================================================
            HEADER
            ================================================================ */}

        <section
          className={
            styles.clientDetailHeader
          }
          aria-hidden="true"
        >
          <div
            className={
              styles.clientsLoadingHeader
            }
          />
        </section>


        {/* ================================================================
            KPI
            ================================================================ */}

        <section
          className={
            styles.clientDetailKpiGrid
          }
          aria-hidden="true"
        >
          {createSkeletonItems(
            DETAIL_KPI_COUNT,
          ).map(
            (
              item,
            ) => (
              <div
                key={
                  `client-detail-kpi-${item}`
                }
                className={
                  styles.clientsLoadingKpi
                }
              />
            ),
          )}
        </section>


        {/* ================================================================
            INFORMATIONS + ADRESSES
            ================================================================ */}

        <section
          className={
            styles.clientDetailTwoColumns
          }
          aria-hidden="true"
        >
          {/* ==============================================================
              INFORMATIONS CLIENT
              ============================================================== */}

          <div
            className={
              styles.clientDetailCard
            }
          >
            <div
              className={
                styles.clientDetailCardHeader
              }
            >
              <div
                className={
                  styles.clientsLoadingRow
                }
                style={{
                  width:
                    "36px",

                  height:
                    "36px",
                }}
              />

              <div
                style={{
                  flex:
                    1,
                }}
              >
                <SkeletonBlock
                  className={
                    styles.clientsLoadingFilter
                  }
                />

                <div
                  style={{
                    height:
                      "7px",
                  }}
                />

                <SkeletonBlock
                  className={
                    styles.clientsLoadingRow
                  }
                />
              </div>
            </div>


            <div
              className={
                styles.clientDetailInfoList
              }
            >
              {createSkeletonItems(
                INFO_ROW_COUNT,
              ).map(
                (
                  item,
                ) => (
                  <div
                    key={
                      `client-info-row-${item}`
                    }
                    className={
                      styles.clientDetailInfoRow
                    }
                  >
                    <div
                      className={
                        styles.clientsLoadingRow
                      }
                      style={{
                        width:
                          "31px",

                        minWidth:
                          "31px",

                        height:
                          "31px",
                      }}
                    />

                    <div
                      style={{
                        width:
                          "100%",
                      }}
                    >
                      <div
                        className={
                          styles.clientsLoadingRow
                        }
                        style={{
                          width:
                            "34%",

                          height:
                            "10px",
                        }}
                      />

                      <div
                        style={{
                          height:
                            "7px",
                        }}
                      />

                      <div
                        className={
                          styles.clientsLoadingRow
                        }
                        style={{
                          width:
                            item % 2 ===
                            0
                              ? "62%"
                              : "48%",

                          height:
                            "14px",
                        }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>


          {/* ==============================================================
              ADRESSES
              ============================================================== */}

          <div
            className={
              styles.clientDetailCard
            }
          >
            <div
              className={
                styles.clientDetailCardHeader
              }
            >
              <div
                className={
                  styles.clientsLoadingRow
                }
                style={{
                  width:
                    "36px",

                  height:
                    "36px",
                }}
              />

              <div
                style={{
                  flex:
                    1,
                }}
              >
                <div
                  className={
                    styles.clientsLoadingRow
                  }
                  style={{
                    width:
                      "42%",

                    height:
                      "15px",
                  }}
                />

                <div
                  style={{
                    height:
                      "7px",
                  }}
                />

                <div
                  className={
                    styles.clientsLoadingRow
                  }
                  style={{
                    width:
                      "68%",

                    height:
                      "11px",
                  }}
                />
              </div>
            </div>


            <div
              className={
                styles.clientDetailAddressList
              }
            >
              {createSkeletonItems(
                ADDRESS_SKELETON_COUNT,
              ).map(
                (
                  item,
                ) => (
                  <div
                    key={
                      `client-address-${item}`
                    }
                    className={
                      styles.clientDetailAddress
                    }
                  >
                    <div
                      className={
                        styles.clientsLoadingRow
                      }
                      style={{
                        width:
                          "34%",

                        height:
                          "12px",
                      }}
                    />

                    <div
                      style={{
                        height:
                          "12px",
                      }}
                    />

                    <div
                      className={
                        styles.clientsLoadingRow
                      }
                      style={{
                        width:
                          "52%",

                        height:
                          "14px",
                      }}
                    />

                    <div
                      style={{
                        height:
                          "9px",
                      }}
                    />

                    <div
                      className={
                        styles.clientsLoadingRow
                      }
                      style={{
                        width:
                          "92%",

                        height:
                          "11px",
                      }}
                    />

                    <div
                      style={{
                        height:
                          "7px",
                      }}
                    />

                    <div
                      className={
                        styles.clientsLoadingRow
                      }
                      style={{
                        width:
                          "70%",

                        height:
                          "11px",
                      }}
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        </section>


        {/* ================================================================
            COMMANDES
            ================================================================ */}

        <section
          className={
            styles.clientDetailOrdersSection
          }
          aria-hidden="true"
        >
          <div
            className={
              styles.clientDetailOrdersHeader
            }
          >
            <div
              className={
                styles.clientDetailCardHeader
              }
            >
              <div
                className={
                  styles.clientsLoadingRow
                }
                style={{
                  width:
                    "36px",

                  height:
                    "36px",
                }}
              />

              <div>
                <div
                  className={
                    styles.clientsLoadingRow
                  }
                  style={{
                    width:
                      "120px",

                    height:
                      "15px",
                  }}
                />

                <div
                  style={{
                    height:
                      "7px",
                  }}
                />

                <div
                  className={
                    styles.clientsLoadingRow
                  }
                  style={{
                    width:
                      "250px",

                    maxWidth:
                      "60vw",

                    height:
                      "11px",
                  }}
                />
              </div>
            </div>


            <div
              className={
                styles.clientsLoadingRow
              }
              style={{
                width:
                  "90px",

                height:
                  "24px",
              }}
            />
          </div>


          <div
            className={
              styles.clientDetailOrdersScroll
            }
          >
            <div
              className={
                styles.clientsLoadingTable
              }
              style={{
                border:
                  "0",

                borderRadius:
                  0,
              }}
            >
              {createSkeletonItems(
                ORDER_SKELETON_COUNT,
              ).map(
                (
                  item,
                ) => (
                  <div
                    key={
                      `client-order-row-${item}`
                    }
                    className={
                      styles.clientsLoadingRow
                    }
                  />
                ),
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}