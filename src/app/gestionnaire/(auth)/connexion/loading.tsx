/* ============================================================
   L&E COSMETICS EMPIRE
   CONNEXION — LOADING STATE
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(auth)/connexion/loading.tsx

   Route :
   /gestionnaire/connexion

   OBJECTIFS :

   - conserver exactement la structure de la page Connexion ;
   - éviter les changements brutaux de mise en page ;
   - afficher un skeleton léger ;
   - rester fidèle aux maquettes PC et mobile ;
   - ne jamais afficher de fausses données ;
   - ne recréer aucune Sidebar ;
   - ne charger aucune logique métier ;
   - rester responsive.

   IMPORTANT :

   Ce composant est purement visuel.

   Il ne :
   - vérifie aucune session ;
   - ne lit aucune donnée privée ;
   - ne déclenche aucune authentification ;
   - ne simule aucun compte.
   ============================================================ */


/* ============================================================
   GENERIC SKELETON
   ============================================================ */

function Skeleton({
  className = "",
}: Readonly<{
  className?:
    string;
}>) {
  return (
    <span
      className={[
        "gestionnaire-login-skeleton",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    />
  );
}


/* ============================================================
   HEADER SKELETON
   ============================================================ */

function LoginHeaderSkeleton() {
  return (
    <header
      className="gestionnaire-login-header"
      aria-hidden="true"
    >
      <div className="gestionnaire-login-header__inner">
        {/* ----------------------------------------------------
            BRAND
            ---------------------------------------------------- */}

        <div className="gestionnaire-login-loading__brand">
          <Skeleton
            className="gestionnaire-login-loading__brand-logo"
          />

          <div className="gestionnaire-login-loading__brand-copy">
            <Skeleton
              className="gestionnaire-login-loading__brand-title"
            />

            <Skeleton
              className="gestionnaire-login-loading__brand-subtitle"
            />
          </div>
        </div>


        {/* ----------------------------------------------------
            REGISTER AREA
            ---------------------------------------------------- */}

        <div className="gestionnaire-login-loading__header-register">
          <Skeleton
            className="gestionnaire-login-loading__header-register-text"
          />

          <Skeleton
            className="gestionnaire-login-loading__header-register-button"
          />
        </div>
      </div>
    </header>
  );
}


/* ============================================================
   CARD HEADER SKELETON
   ============================================================ */

function LoginCardHeaderSkeleton() {
  return (
    <div
      className="gestionnaire-login-card__header"
      aria-hidden="true"
    >
      <Skeleton
        className="gestionnaire-login-loading__eyebrow"
      />

      <Skeleton
        className="gestionnaire-login-loading__title"
      />

      <Skeleton
        className="gestionnaire-login-loading__subtitle"
      />
    </div>
  );
}


/* ============================================================
   FIELD SKELETON
   ============================================================ */

function LoginFieldSkeleton() {
  return (
    <div
      className="gestionnaire-login-loading__field"
      aria-hidden="true"
    >
      <Skeleton
        className="gestionnaire-login-loading__field-icon"
      />

      <Skeleton
        className="gestionnaire-login-loading__field-text"
      />
    </div>
  );
}


/* ============================================================
   LOGIN FORM SKELETON
   ============================================================ */

function LoginFormSkeleton() {
  return (
    <div
      className="gestionnaire-login-form gestionnaire-login-form--loading"
      aria-hidden="true"
    >
      {/* ------------------------------------------------------
          FIELDS
          ------------------------------------------------------ */}

      <div className="gestionnaire-login-form__fields">
        <LoginFieldSkeleton />

        <LoginFieldSkeleton />
      </div>


      {/* ------------------------------------------------------
          FORGOT PASSWORD
          ------------------------------------------------------ */}

      <div className="gestionnaire-login-form__forgot">
        <Skeleton
          className="gestionnaire-login-loading__forgot"
        />
      </div>


      {/* ------------------------------------------------------
          SUBMIT BUTTON
          ------------------------------------------------------ */}

      <Skeleton
        className="gestionnaire-login-loading__submit"
      />


      {/* ------------------------------------------------------
          DIVIDER
          ------------------------------------------------------ */}

      <div className="gestionnaire-login-form__divider">
        <span className="gestionnaire-login-form__divider-line" />

        <Skeleton
          className="gestionnaire-login-loading__divider-text"
        />

        <span className="gestionnaire-login-form__divider-line" />
      </div>


      {/* ------------------------------------------------------
          REGISTER
          ------------------------------------------------------ */}

      <div className="gestionnaire-login-form__register">
        <Skeleton
          className="gestionnaire-login-loading__register-text"
        />

        <Skeleton
          className="gestionnaire-login-loading__register-link"
        />
      </div>


      {/* ------------------------------------------------------
          SECURITY NOTICE
          ------------------------------------------------------ */}

      <div className="gestionnaire-login-security">
        <Skeleton
          className="gestionnaire-login-loading__security-icon"
        />

        <div className="gestionnaire-login-security__content">
          <Skeleton
            className="gestionnaire-login-loading__security-title"
          />

          <Skeleton
            className="gestionnaire-login-loading__security-description"
          />
        </div>
      </div>
    </div>
  );
}


/* ============================================================
   FOOTER SKELETON
   ============================================================ */

function LoginFooterSkeleton() {
  return (
    <footer
      className="gestionnaire-login-footer"
      aria-hidden="true"
    >
      <Skeleton
        className="gestionnaire-login-loading__footer"
      />
    </footer>
  );
}


/* ============================================================
   PAGE LOADING
   ============================================================ */

export default function GestionnaireLoginLoading() {
  return (
    <div
      className="gestionnaire-login-page gestionnaire-login-page--loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Chargement de la page de connexion"
    >
      {/* ======================================================
          BACKGROUND DECORATIONS
          ====================================================== */}

      <div
        className="gestionnaire-login-page__decoration gestionnaire-login-page__decoration--left"
        aria-hidden="true"
      />

      <div
        className="gestionnaire-login-page__decoration gestionnaire-login-page__decoration--right"
        aria-hidden="true"
      />


      {/* ======================================================
          HEADER
          ====================================================== */}

      <LoginHeaderSkeleton />


      {/* ======================================================
          MAIN
          ====================================================== */}

      <main className="gestionnaire-login-main">
        <section
          className="gestionnaire-login-card"
          aria-hidden="true"
        >
          <LoginCardHeaderSkeleton />

          <LoginFormSkeleton />
        </section>
      </main>


      {/* ======================================================
          FOOTER
          ====================================================== */}

      <LoginFooterSkeleton />


      {/* ======================================================
          ACCESSIBLE STATUS
          ====================================================== */}

      <span className="gestionnaire-login-sr-only">
        Chargement de la page de connexion Gestionnaire.
      </span>
    </div>
  );
}