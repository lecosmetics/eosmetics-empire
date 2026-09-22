import type {
  CSSProperties,
} from "react";

import styles from "./ajouter-produit.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — AJOUTER UN PRODUIT
 * LOADING
 * ============================================================================
 *
 * Route :
 *
 * /gestionnaire/produits/ajouter
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/produits/ajouter/loading.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher immédiatement un skeleton pendant le chargement initial ;
 * - conserver la géométrie générale de la vraie page ;
 * - éviter un déplacement brutal du contenu à la fin du chargement ;
 * - rester responsive ;
 * - ne déclencher aucune requête ;
 * - ne contenir aucun état Client ;
 * - ne recréer ni le sidebar ni le header Gestionnaire global.
 *
 * Le shell privé parent continue de gérer :
 *
 * - sidebar ;
 * - header global ;
 * - navigation ;
 * - largeur générale de l'espace privé.
 *
 * ============================================================================
 */


/* ==========================================================================
   SKELETON
   ========================================================================== */

interface SkeletonProps {
  width?:
    CSSProperties["width"];

  height:
    number;

  borderRadius?:
    CSSProperties["borderRadius"];

  className?:
    string;
}


function Skeleton({
  width =
    "100%",
  height,
  borderRadius,
  className,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        styles.skeleton,

        className ??
          "",
      ]
        .filter(
          Boolean,
        )
        .join(
          " ",
        )}
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
}


/* ==========================================================================
   CARD HEADER SKELETON
   ========================================================================== */

interface LoadingCardHeaderProps {
  titleWidth?:
    CSSProperties["width"];

  subtitleWidth?:
    CSSProperties["width"];
}


function LoadingCardHeader({
  titleWidth =
    180,

  subtitleWidth =
    "72%",
}: LoadingCardHeaderProps) {
  return (
    <div
      className={
        styles.cardHeader
      }
      aria-hidden="true"
    >
      <div
        className={
          styles.cardHeaderMain
        }
      >
        <Skeleton
          width={38}
          height={38}
          borderRadius={10}
        />

        <div
          className={
            styles.cardHeaderContent
          }
        >
          <Skeleton
            width={
              titleWidth
            }
            height={15}
            borderRadius={6}
          />

          <div
            style={{
              marginTop:
                8,
            }}
          >
            <Skeleton
              width={
                subtitleWidth
              }
              height={10}
              borderRadius={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


/* ==========================================================================
   FIELD SKELETON
   ========================================================================== */

interface LoadingFieldProps {
  labelWidth?:
    CSSProperties["width"];

  height?:
    number;

  helpWidth?:
    CSSProperties["width"];

  multiline?:
    boolean;
}


function LoadingField({
  labelWidth =
    105,

  height =
    46,

  helpWidth =
    "58%",

  multiline =
    false,
}: LoadingFieldProps) {
  return (
    <div
      className={
        styles.field
      }
      aria-hidden="true"
    >
      <Skeleton
        width={
          labelWidth
        }
        height={10}
        borderRadius={5}
      />

      <div
        style={{
          marginTop:
            9,
        }}
      >
        <Skeleton
          width="100%"
          height={
            multiline
              ? Math.max(
                  height,
                  120,
                )
              : height
          }
          borderRadius={9}
        />
      </div>

      <div
        style={{
          marginTop:
            8,
        }}
      >
        <Skeleton
          width={
            helpWidth
          }
          height={8}
          borderRadius={4}
        />
      </div>
    </div>
  );
}


/* ==========================================================================
   GENERAL INFORMATION
   ========================================================================== */

function LoadingGeneralInformationCard() {
  return (
    <section
      className={
        styles.card
      }
      aria-hidden="true"
    >
      <LoadingCardHeader
        titleWidth={190}
        subtitleWidth="68%"
      />

      <div
        className={
          styles.cardBody
        }
      >
        <LoadingField
          labelWidth={112}
          helpWidth="34%"
        />

        <div
          className={
            styles.twoColumnFields
          }
        >
          <LoadingField
            labelWidth={78}
            helpWidth="62%"
          />

          <LoadingField
            labelWidth={62}
            helpWidth="56%"
          />
        </div>

        <LoadingField
          labelWidth={90}
          height={148}
          helpWidth="76%"
          multiline
        />
      </div>
    </section>
  );
}


/* ==========================================================================
   PRICING + STOCK
   ========================================================================== */

function LoadingPricingStockCard() {
  return (
    <section
      className={
        styles.card
      }
      aria-hidden="true"
    >
      <LoadingCardHeader
        titleWidth={125}
        subtitleWidth="74%"
      />

      <div
        className={
          styles.cardBody
        }
      >
        <div
          className={
            styles.twoColumnFields
          }
        >
          <LoadingField
            labelWidth={92}
            helpWidth="70%"
          />

          <LoadingField
            labelWidth={82}
            helpWidth="78%"
          />
        </div>

        <div
          className={
            styles.twoColumnFields
          }
        >
          <LoadingField
            labelWidth={118}
            helpWidth="76%"
          />

          <LoadingField
            labelWidth={52}
            helpWidth="68%"
          />
        </div>

        <div
          className={
            styles.sectionInformation
          }
        >
          <Skeleton
            width={34}
            height={34}
            borderRadius={9}
          />

          <div
            className={
              styles.sectionInformationContent
            }
            style={{
              flex:
                1,
            }}
          >
            <Skeleton
              width={172}
              height={10}
              borderRadius={5}
            />

            <div
              style={{
                marginTop:
                  7,
              }}
            >
              <Skeleton
                width="82%"
                height={8}
                borderRadius={4}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   ADDITIONAL DETAILS
   ========================================================================== */

function LoadingDetailsCard() {
  return (
    <section
      className={
        styles.card
      }
      aria-hidden="true"
    >
      <LoadingCardHeader
        titleWidth={190}
        subtitleWidth="78%"
      />

      <div
        className={
          styles.cardBody
        }
      >
        <LoadingField
          labelWidth={82}
          height={112}
          helpWidth="86%"
          multiline
        />

        <LoadingField
          labelWidth={132}
          helpWidth="72%"
        />

        <LoadingField
          labelWidth={128}
          height={126}
          helpWidth="83%"
          multiline
        />
      </div>
    </section>
  );
}


/* ==========================================================================
   IMAGES
   ========================================================================== */

function LoadingImagesCard() {
  return (
    <section
      className={
        styles.card
      }
      aria-hidden="true"
    >
      <LoadingCardHeader
        titleWidth={156}
        subtitleWidth="86%"
      />

      <div
        className={
          styles.cardBody
        }
      >
        {/* DROPZONE */}

        <Skeleton
          width="100%"
          height={176}
          borderRadius={12}
        />

        <div
          style={{
            marginTop:
              10,
          }}
        >
          <Skeleton
            width="78%"
            height={8}
            borderRadius={4}
          />
        </div>


        {/* MINIATURES */}

        <div
          style={{
            marginTop:
              20,
          }}
        >
          <Skeleton
            width={82}
            height={11}
            borderRadius={5}
          />
        </div>

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",

            gap:
              10,

            marginTop:
              12,
          }}
        >
          <Skeleton
            height={100}
            borderRadius={10}
          />

          <Skeleton
            height={100}
            borderRadius={10}
          />

          <Skeleton
            height={100}
            borderRadius={10}
          />
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   PRODUCT PREVIEW
   ========================================================================== */

function LoadingPreviewCard() {
  return (
    <section
      className={
        styles.card
      }
      aria-hidden="true"
    >
      <LoadingCardHeader
        titleWidth={144}
        subtitleWidth="84%"
      />

      <div
        className={
          styles.cardBody
        }
      >
        <div
          className={
            styles.productPreview
          }
        >
          <div
            className={
              styles.productPreviewMedia
            }
          >
            <Skeleton
              width="100%"
              height={220}
              borderRadius={12}
            />
          </div>

          <div
            className={
              styles.productPreviewContent
            }
          >
            <Skeleton
              width={92}
              height={8}
              borderRadius={4}
            />

            <div
              style={{
                marginTop:
                  9,
              }}
            >
              <Skeleton
                width="74%"
                height={17}
                borderRadius={6}
              />
            </div>

            <div
              style={{
                marginTop:
                  10,
              }}
            >
              <Skeleton
                width="100%"
                height={8}
                borderRadius={4}
              />
            </div>

            <div
              style={{
                marginTop:
                  6,
              }}
            >
              <Skeleton
                width="82%"
                height={8}
                borderRadius={4}
              />
            </div>

            <div
              style={{
                marginTop:
                  17,
              }}
            >
              <Skeleton
                width={132}
                height={20}
                borderRadius={6}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   QR
   ========================================================================== */

function LoadingQrCard() {
  return (
    <section
      className={
        styles.card
      }
      aria-hidden="true"
    >
      <LoadingCardHeader
        titleWidth={152}
        subtitleWidth="88%"
      />

      <div
        className={
          styles.cardBody
        }
      >
        <div
          className={
            styles.qrPending
          }
        >
          <Skeleton
            width={84}
            height={84}
            borderRadius={12}
          />

          <div
            className={
              styles.qrPendingContent
            }
            style={{
              flex:
                1,
            }}
          >
            <Skeleton
              width={142}
              height={11}
              borderRadius={5}
            />

            <div
              style={{
                marginTop:
                  8,
              }}
            >
              <Skeleton
                width="92%"
                height={8}
                borderRadius={4}
              />
            </div>

            <div
              style={{
                marginTop:
                  6,
              }}
            >
              <Skeleton
                width="68%"
                height={8}
                borderRadius={4}
              />
            </div>
          </div>
        </div>

        <div
          className={
            styles.sectionInformation
          }
          style={{
            marginTop:
              16,
          }}
        >
          <Skeleton
            width={34}
            height={34}
            borderRadius={9}
          />

          <div
            className={
              styles.sectionInformationContent
            }
            style={{
              flex:
                1,
            }}
          >
            <Skeleton
              width={116}
              height={10}
              borderRadius={5}
            />

            <div
              style={{
                marginTop:
                  7,
              }}
            >
              <Skeleton
                width="88%"
                height={8}
                borderRadius={4}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   STATUS
   ========================================================================== */

function LoadingStatusCard() {
  return (
    <section
      className={
        styles.card
      }
      aria-hidden="true"
    >
      <LoadingCardHeader
        titleWidth={72}
        subtitleWidth="76%"
      />

      <div
        className={
          styles.cardBody
        }
      >
        <div
          className={
            styles.statusOptions
          }
        >
          {[
            "published",
            "draft",
            "inactive",
          ].map(
            (
              key,
            ) => (
              <div
                key={key}
                className={
                  styles.statusOption
                }
              >
                <Skeleton
                  width={36}
                  height={36}
                  borderRadius={10}
                />

                <div
                  className={
                    styles.statusOptionContent
                  }
                  style={{
                    flex:
                      1,
                  }}
                >
                  <Skeleton
                    width={84}
                    height={10}
                    borderRadius={5}
                  />

                  <div
                    style={{
                      marginTop:
                        7,
                    }}
                  >
                    <Skeleton
                      width="90%"
                      height={8}
                      borderRadius={4}
                    />
                  </div>

                  <div
                    style={{
                      marginTop:
                        5,
                    }}
                  >
                    <Skeleton
                      width="67%"
                      height={8}
                      borderRadius={4}
                    />
                  </div>
                </div>
              </div>
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

export default function AjouterProduitLoading() {
  return (
    <div
      className={
        styles.page
      }
      aria-busy="true"
      aria-label="Chargement du formulaire d’ajout de produit"
    >
      {/* ===================================================================
          ACCESSIBILITÉ
          =================================================================== */}

      <span
        className={
          styles.srOnly
        }
        role="status"
        aria-live="polite"
      >
        Chargement du formulaire d’ajout de produit.
      </span>


      {/* ===================================================================
          BREADCRUMB
          =================================================================== */}

      <div
        className={
          styles.breadcrumb
        }
        aria-hidden="true"
      >
        <Skeleton
          width={62}
          height={10}
          borderRadius={5}
        />

        <Skeleton
          width={12}
          height={12}
          borderRadius={4}
        />

        <Skeleton
          width={110}
          height={10}
          borderRadius={5}
        />
      </div>


      {/* ===================================================================
          PAGE HEADER
          =================================================================== */}

      <header
        className={
          styles.pageHeader
        }
        aria-hidden="true"
      >
        <div
          className={
            styles.pageHeaderContent
          }
        >
          <Skeleton
            width={250}
            height={30}
            borderRadius={8}
          />

          <div
            style={{
              marginTop:
                10,
            }}
          >
            <Skeleton
              width="min(520px, 82vw)"
              height={11}
              borderRadius={5}
            />
          </div>
        </div>


        <div
          className={
            styles.pageActions
          }
        >
          <Skeleton
            width={218}
            height={42}
            borderRadius={9}
          />

          <Skeleton
            width={168}
            height={42}
            borderRadius={9}
          />
        </div>
      </header>


      {/* ===================================================================
          CONTENT GRID
          =================================================================== */}

      <div
        className={
          styles.contentGrid
        }
      >
        {/* ===============================================================
            LEFT
            =============================================================== */}

        <div
          className={
            styles.leftColumn
          }
        >
          <LoadingGeneralInformationCard />

          <LoadingPricingStockCard />

          <LoadingDetailsCard />
        </div>


        {/* ===============================================================
            RIGHT
            =============================================================== */}

        <aside
          className={
            styles.rightColumn
          }
          aria-hidden="true"
        >
          <LoadingImagesCard />

          <LoadingPreviewCard />

          <LoadingQrCard />

          <LoadingStatusCard />
        </aside>
      </div>


      {/* ===================================================================
          MOBILE ACTION BAR PLACEHOLDER
          =================================================================== */}

      <div
        className={
          styles.mobileActions
        }
        aria-hidden="true"
      >
        <Skeleton
          width="100%"
          height={44}
          borderRadius={9}
        />

        <Skeleton
          width="100%"
          height={44}
          borderRadius={9}
        />
      </div>
    </div>
  );
}