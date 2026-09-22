"use client";

import {
  useEffect,
  useMemo,
  useTransition,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  Database,
  LoaderCircle,
  Package2,
  RefreshCw,
  ShieldCheck,
  WifiOff,
} from "lucide-react";

import {
  routes,
} from "@/config/routes";

import styles from "./product-detail.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE â€” ERREUR FICHE PRODUIT
 * ============================================================================
 *
 * Route :
 *
 * /gestionnaire/produits/[productId]
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/produits/[productId]/error.tsx
 *
 * RÃ”LE :
 *
 * Error Boundary locale de la fiche produit.
 *
 * Ce composant intervient uniquement lorsqu'une erreur technique inattendue
 * remonte pendant le rendu de la route.
 *
 * Exemples :
 *
 * - erreur PostgreSQL / Prisma ;
 * - erreur rÃ©seau cÃ´tÃ© serveur ;
 * - service temporairement indisponible ;
 * - problÃ¨me lors du chargement des donnÃ©es du produit ;
 * - erreur imprÃ©vue dans un Server Component.
 *
 * IMPORTANT :
 *
 * Les situations normales suivantes NE doivent pas arriver ici :
 *
 * - productId invalide ;
 * - produit inexistant ;
 * - produit appartenant Ã  une autre boutique ;
 * - produit inaccessible.
 *
 * Ces cas sont transformÃ©s en notFound() dans page.tsx.
 *
 * SÃ‰CURITÃ‰ :
 *
 * L'interface n'affiche jamais :
 *
 * - error.message ;
 * - error.stack ;
 * - SQL ;
 * - URL PostgreSQL ;
 * - variable d'environnement ;
 * - storeId ;
 * - managerId ;
 * - qrToken ;
 * - informations techniques sensibles.
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

interface ProductDetailErrorProps {
  error:
    Error & {
      digest?:
        string;
    };

  reset:
    () => void;
}


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const MAX_ERROR_REFERENCE_LENGTH =
  80;


/* ==========================================================================
   ERROR REFERENCE
   ========================================================================== */

/**
 * Le digest Next.js est une rÃ©fÃ©rence opaque.
 *
 * On ne l'utilise jamais pour dÃ©duire la nature de l'erreur.
 * Il sert uniquement de rÃ©fÃ©rence Ã©ventuelle pour le support.
 */

function normalizeErrorReference(
  value:
    unknown,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  if (
    !normalized ||
    normalized.length >
      MAX_ERROR_REFERENCE_LENGTH
  ) {
    return null;
  }


  /*
   * On limite volontairement les caractÃ¨res affichables.
   */
  if (
    !/^[A-Za-z0-9._:-]+$/.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function ProductDetailError({
  error,
  reset,
}: ProductDetailErrorProps) {
  /* =========================================================================
     RETRY STATE
     ========================================================================= */

  const [
    isRetrying,
    startRetry,
  ] =
    useTransition();


  /* =========================================================================
     SAFE REFERENCE
     ========================================================================= */

  const errorReference =
    useMemo(
      () =>
        normalizeErrorReference(
          error.digest,
        ),
      [
        error.digest,
      ],
    );


  /* =========================================================================
     DEVELOPMENT LOGGING
     =========================================================================
     
     Le dÃ©tail technique est utile pendant le dÃ©veloppement.
     
     En production, on Ã©vite volontairement de recopier l'objet d'erreur
     complet dans la console navigateur du Gestionnaire.
     ========================================================================= */

  useEffect(
    () => {
      if (
        process.env.NODE_ENV !==
        "development"
      ) {
        return;
      }


      console.error(
        "[L&E Cosmetics Empire][ProductDetailError]",
        error,
      );
    },
    [
      error,
    ],
  );


  /* =========================================================================
     RETRY
     ========================================================================= */

  function handleRetry():
    void {
    if (
      isRetrying
    ) {
      return;
    }


    startRetry(
      () => {
        reset();
      },
    );
  }


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <>
      <div
        className={
          styles.page
        }
      >
        <main
          className="productDetailErrorPage"
          aria-labelledby="product-detail-error-title"
        >
          {/* ===============================================================
              CONTEXT
              =============================================================== */}

          <header className="productDetailErrorContext">
            <span
              className="productDetailErrorContextIcon"
              aria-hidden="true"
            >
              <Package2
                size={21}
                strokeWidth={1.8}
              />
            </span>

            <div className="productDetailErrorContextContent">
              <span className="productDetailErrorContextEyebrow">
                Gestion des produits
              </span>

              <strong className="productDetailErrorContextTitle">
                Fiche produit
              </strong>
            </div>
          </header>


          {/* ===============================================================
              ERROR CARD
              =============================================================== */}

          <section
            className="productDetailErrorCard"
            role="alert"
            aria-live="assertive"
          >
            {/* =============================================================
                ICON
                ============================================================= */}

            <div
              className="productDetailErrorMainIcon"
              aria-hidden="true"
            >
              <AlertTriangle
                size={34}
                strokeWidth={1.7}
              />
            </div>


            {/* =============================================================
                CONTENT
                ============================================================= */}

            <div className="productDetailErrorContent">
              <span className="productDetailErrorEyebrow">
                Erreur de chargement
              </span>

              <h1
                id="product-detail-error-title"
                className="productDetailErrorTitle"
              >
                Impossible dâ€™afficher la fiche produit
              </h1>

              <p className="productDetailErrorDescription">
                Une erreur technique est survenue pendant le chargement des
                informations du produit. Vos donnÃ©es nâ€™ont pas Ã©tÃ© modifiÃ©es
                par cette page dâ€™erreur.
              </p>


              {/* ===========================================================
                  INFORMATION GRID
                  =========================================================== */}

              <div className="productDetailErrorInformationGrid">
                <article className="productDetailErrorInformationCard">
                  <span
                    className="productDetailErrorInformationIcon"
                    aria-hidden="true"
                  >
                    <Database
                      size={19}
                      strokeWidth={1.8}
                    />
                  </span>

                  <div className="productDetailErrorInformationContent">
                    <strong>
                      Chargement interrompu
                    </strong>

                    <p>
                      Certaines informations du produit nâ€™ont pas pu Ãªtre
                      rÃ©cupÃ©rÃ©es correctement.
                    </p>
                  </div>
                </article>


                <article className="productDetailErrorInformationCard">
                  <span
                    className="productDetailErrorInformationIcon"
                    aria-hidden="true"
                  >
                    <ShieldCheck
                      size={19}
                      strokeWidth={1.8}
                    />
                  </span>

                  <div className="productDetailErrorInformationContent">
                    <strong>
                      AccÃ¨s toujours protÃ©gÃ©
                    </strong>

                    <p>
                      Lâ€™erreur nâ€™autorise pas lâ€™accÃ¨s aux produits appartenant
                      Ã  une autre boutique.
                    </p>
                  </div>
                </article>


                <article className="productDetailErrorInformationCard">
                  <span
                    className="productDetailErrorInformationIcon"
                    aria-hidden="true"
                  >
                    <RefreshCw
                      size={19}
                      strokeWidth={1.8}
                    />
                  </span>

                  <div className="productDetailErrorInformationContent">
                    <strong>
                      Nouvelle tentative
                    </strong>

                    <p>
                      Vous pouvez relancer le chargement de cette fiche sans
                      quitter votre espace Gestionnaire.
                    </p>
                  </div>
                </article>


                <article className="productDetailErrorInformationCard">
                  <span
                    className="productDetailErrorInformationIcon"
                    aria-hidden="true"
                  >
                    <WifiOff
                      size={19}
                      strokeWidth={1.8}
                    />
                  </span>

                  <div className="productDetailErrorInformationContent">
                    <strong>
                      Erreur temporaire possible
                    </strong>

                    <p>
                      Si le problÃ¨me persiste, revenez Ã  la liste des produits
                      puis rÃ©essayez ultÃ©rieurement.
                    </p>
                  </div>
                </article>
              </div>


              {/* ===========================================================
                  REFERENCE
                  =========================================================== */}

              {errorReference ? (
                <div className="productDetailErrorReference">
                  <span>
                    RÃ©fÃ©rence technique
                  </span>

                  <code>
                    {errorReference}
                  </code>
                </div>
              ) : null}


              {/* ===========================================================
                  ACTIONS
                  =========================================================== */}

              <div className="productDetailErrorActions">
                <button
                  type="button"
                  onClick={
                    handleRetry
                  }
                  disabled={
                    isRetrying
                  }
                  className="productDetailErrorRetryButton"
                >
                  {isRetrying ? (
                    <LoaderCircle
                      size={17}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="productDetailErrorSpinner"
                    />
                  ) : (
                    <RefreshCw
                      size={17}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                  )}

                  <span>
                    {isRetrying
                      ? "Nouvelle tentative..."
                      : "RÃ©essayer"}
                  </span>
                </button>


                <Link
                  href={
                    routes
                      .gestionnaire
                      .products
                  }
                  className="productDetailErrorBackButton"
                >
                  <ArrowLeft
                    size={17}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Retour aux produits
                  </span>
                </Link>
              </div>


              {/* ===========================================================
                  SECURITY NOTICE
                  =========================================================== */}

              <div className="productDetailErrorSecurity">
                <ShieldCheck
                  size={17}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <p>
                  Aucun dÃ©tail technique sensible nâ€™est affichÃ© dans cette
                  interface.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>


      {/* ===================================================================
          STYLE LOCAL
          -------------------------------------------------------------------
          Le CSS principal de la fiche gÃ¨re toujours styles.page et le shell.
          
          Ces styles appartiennent uniquement Ã  l'Error Boundary afin de ne
          pas imposer une modification immÃ©diate de produit-detail.module.css.
          =================================================================== */}

      <style jsx>{`
        .productDetailErrorPage {
          width: 100%;
          max-width: none;
          min-width: 0;
          margin: 0;
          padding: 0;
        }

        .productDetailErrorContext {
          display: flex;
          width: 100%;
          min-width: 0;
          align-items: center;
          gap: 11px;
          margin-bottom: 16px;
        }

        .productDetailErrorContextIcon {
          display: inline-flex;
          flex: 0 0 auto;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          color: #ec0067;
          background: #fff1f7;
          border: 1px solid #f8cfdf;
          border-radius: 10px;
        }

        .productDetailErrorContextContent {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 2px;
        }

        .productDetailErrorContextEyebrow {
          color: #98989f;
          font-size: 9px;
          font-weight: 800;
          line-height: 1.3;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .productDetailErrorContextTitle {
          color: #29292e;
          font-size: 13px;
          font-weight: 800;
          line-height: 1.35;
        }

        .productDetailErrorCard {
          display: flex;
          width: 100%;
          max-width: none;
          min-width: 0;
          align-items: flex-start;
          gap: 18px;
          padding: 24px;
          border: 1px solid #e4e4e7;
          border-radius: 15px;
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(185, 28, 28, 0.035),
              transparent 31%
            ),
            #ffffff;
          box-shadow:
            0 1px 2px rgba(24, 24, 27, 0.025),
            0 8px 28px rgba(24, 24, 27, 0.035);
        }

        .productDetailErrorMainIcon {
          display: inline-flex;
          flex: 0 0 auto;
          width: 62px;
          height: 62px;
          align-items: center;
          justify-content: center;
          color: #b42318;
          background: #fff1f1;
          border: 1px solid #fecaca;
          border-radius: 15px;
        }

        .productDetailErrorContent {
          width: 100%;
          min-width: 0;
          flex: 1 1 auto;
        }

        .productDetailErrorEyebrow {
          display: block;
          margin-bottom: 5px;
          color: #b42318;
          font-size: 9px;
          font-weight: 850;
          line-height: 1.3;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .productDetailErrorTitle {
          margin: 0;
          color: #18181b;
          font-size: clamp(22px, 2vw, 29px);
          font-weight: 850;
          line-height: 1.2;
          letter-spacing: -0.03em;
        }

        .productDetailErrorDescription {
          max-width: 780px;
          margin: 8px 0 0;
          color: #71717a;
          font-size: 12px;
          line-height: 1.65;
        }

        .productDetailErrorInformationGrid {
          display: grid;
          width: 100%;
          min-width: 0;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 20px;
        }

        .productDetailErrorInformationCard {
          display: flex;
          min-width: 0;
          align-items: flex-start;
          gap: 10px;
          padding: 13px;
          border: 1px solid #e8e8eb;
          border-radius: 10px;
          background: #fafafa;
        }

        .productDetailErrorInformationIcon {
          display: inline-flex;
          flex: 0 0 auto;
          width: 34px;
          height: 34px;
          align-items: center;
          justify-content: center;
          color: #686870;
          background: #ffffff;
          border: 1px solid #e7e7ea;
          border-radius: 8px;
        }

        .productDetailErrorInformationContent {
          min-width: 0;
          flex: 1 1 auto;
        }

        .productDetailErrorInformationContent strong {
          display: block;
          color: #3f3f46;
          font-size: 10.5px;
          font-weight: 800;
          line-height: 1.4;
        }

        .productDetailErrorInformationContent p {
          margin: 4px 0 0;
          color: #7c7c85;
          font-size: 9.5px;
          line-height: 1.55;
        }

        .productDetailErrorReference {
          display: flex;
          min-width: 0;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 14px;
          padding: 9px 11px;
          border: 1px solid #eeeeef;
          border-radius: 8px;
          background: #fafafa;
          color: #8b8b93;
          font-size: 9px;
        }

        .productDetailErrorReference code {
          max-width: 100%;
          overflow: hidden;
          padding: 3px 6px;
          color: #5f5f67;
          background: #eeeeef;
          border-radius: 5px;
          font-family:
            ui-monospace,
            SFMono-Regular,
            Menlo,
            Monaco,
            Consolas,
            monospace;
          font-size: 8.5px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .productDetailErrorActions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
          margin-top: 20px;
        }

        .productDetailErrorRetryButton,
        .productDetailErrorBackButton {
          display: inline-flex;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 14px;
          border: 1px solid transparent;
          border-radius: 9px;
          font: inherit;
          font-size: 10.5px;
          font-weight: 780;
          line-height: 1;
          text-decoration: none;
          cursor: pointer;
          transition:
            background-color 150ms ease,
            border-color 150ms ease,
            color 150ms ease,
            box-shadow 150ms ease;
        }

        .productDetailErrorRetryButton {
          color: #ffffff;
          background: #18181b;
          border-color: #18181b;
        }

        .productDetailErrorRetryButton:hover:not(:disabled) {
          background: #2c2c30;
          border-color: #2c2c30;
        }

        .productDetailErrorBackButton {
          color: #46464d;
          background: #ffffff;
          border-color: #dddde2;
        }

        .productDetailErrorBackButton:hover {
          color: #18181b;
          background: #f8f8f9;
          border-color: #ceced3;
        }

        .productDetailErrorRetryButton:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .productDetailErrorRetryButton:focus-visible,
        .productDetailErrorBackButton:focus-visible {
          outline: 3px solid rgba(236, 0, 103, 0.17);
          outline-offset: 2px;
        }

        .productDetailErrorSpinner {
          animation:
            productDetailErrorSpin
            700ms
            linear
            infinite;
        }

        .productDetailErrorSecurity {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          max-width: 760px;
          margin-top: 17px;
          padding-top: 14px;
          border-top: 1px solid #eeeeef;
          color: #8a8a92;
        }

        .productDetailErrorSecurity svg {
          flex: 0 0 auto;
          margin-top: 1px;
          color: #777780;
        }

        .productDetailErrorSecurity p {
          margin: 0;
          font-size: 9px;
          line-height: 1.5;
        }

        @keyframes productDetailErrorSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 760px) {
          .productDetailErrorCard {
            padding: 19px;
          }

          .productDetailErrorInformationGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .productDetailErrorCard {
            flex-direction: column;
            gap: 14px;
            padding: 16px;
            border-radius: 13px;
          }

          .productDetailErrorMainIcon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
          }

          .productDetailErrorTitle {
            font-size: 21px;
          }

          .productDetailErrorDescription {
            font-size: 11px;
          }

          .productDetailErrorActions {
            width: 100%;
            align-items: stretch;
            flex-direction: column;
          }

          .productDetailErrorRetryButton,
          .productDetailErrorBackButton {
            width: 100%;
          }

          .productDetailErrorReference {
            align-items: flex-start;
            flex-direction: column;
          }

          .productDetailErrorReference code {
            width: 100%;
            white-space: normal;
            overflow-wrap: anywhere;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .productDetailErrorSpinner {
            animation: none;
          }

          .productDetailErrorRetryButton,
          .productDetailErrorBackButton {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}
