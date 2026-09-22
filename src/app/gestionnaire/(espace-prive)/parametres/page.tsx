import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";

import {
  getGestionnaireProfilePageData,
} from "@/lib/gestionnaire/profil/profile-query";

import {
  getGestionnaireProfileManagerStatusLabel,
  getGestionnaireProfileRoleLabel,
  getGestionnaireProfileStoreStatusLabel,
} from "@/lib/gestionnaire/profil/profile-types";

import styles from "./parametres.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PARAMÈTRES
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/parametres/page.tsx
 *
 * Route :
 *
 * /gestionnaire/parametres
 *
 *
 * ARCHITECTURE :
 *
 * Cette page dépend volontairement du module Profil existant.
 *
 * Elle réutilise :
 *
 * src/lib/gestionnaire/profil/profile-query.ts
 *
 * avec :
 *
 * getGestionnaireProfilePageData()
 *
 *
 * La page Paramètres NE MODIFIE AUCUNE donnée.
 *
 * Toutes les modifications sont réalisées depuis :
 *
 * /gestionnaire/profil
 *
 *
 * Cette page doit donc :
 *
 * - lire les données réelles du Gestionnaire ;
 * - lire les données réelles de la boutique ;
 * - lire les informations de sécurité déjà disponibles ;
 * - présenter ces informations proprement ;
 * - rediriger vers le Profil pour toute modification ;
 * - ne pas dupliquer la logique du Profil ;
 * - ne pas créer de formulaire ;
 * - ne pas créer de Server Action ;
 * - ne pas effectuer de requête Prisma directe ;
 * - ne pas accepter managerId depuis le navigateur ;
 * - ne pas accepter storeId depuis le navigateur ;
 * - ne pas dupliquer la sidebar ;
 * - ne pas dupliquer le header global ;
 * - ne pas créer de second <main>.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES EXISTANTES
   ========================================================================== */

const DASHBOARD_ROUTE =
  "/gestionnaire/tableau-de-bord";


const PROFILE_ROUTE =
  "/gestionnaire/profil";


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata: Metadata = {
  title:
    "Paramètres | Cosmetics Empire",

  description:
    "Consultez les principaux paramètres de votre compte Gestionnaire et accédez à votre profil pour les modifier.",
};


/* ==========================================================================
   RENDU DYNAMIQUE
   ========================================================================== */

/**
 * Les informations affichées dépendent :
 *
 * - de la session Gestionnaire actuelle ;
 * - du Manager actuellement connecté ;
 * - de la boutique rattachée à ce Manager.
 *
 * La page ne doit donc pas être pré-rendue avec les données d'un utilisateur.
 */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/* ==========================================================================
   DATE
   ========================================================================== */

const DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",
    },
  );


const DATE_TIME_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );


function formatDate(
  value:
    string | null,
): string {
  if (
    !value
  ) {
    return "Non renseignée";
  }


  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Non renseignée";
  }


  return DATE_FORMATTER.format(
    date,
  );
}


function formatDateTime(
  value:
    string | null,
): string {
  if (
    !value
  ) {
    return "Aucune donnée enregistrée";
  }


  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Non renseignée";
  }


  return DATE_TIME_FORMATTER.format(
    date,
  );
}


/* ==========================================================================
   INFORMATION ROW
   ========================================================================== */

interface SettingsInfoRowProps {
  readonly icon:
    typeof Mail;

  readonly label:
    string;

  readonly value:
    string;
}


function SettingsInfoRow({
  icon: Icon,
  label,
  value,
}: SettingsInfoRowProps) {
  return (
    <div className={styles.infoRow}>
      <div
        className={styles.infoIcon}
        aria-hidden="true"
      >
        <Icon
          size={18}
          strokeWidth={1.8}
        />
      </div>

      <div className={styles.infoContent}>
        <span className={styles.infoLabel}>
          {label}
        </span>

        <strong className={styles.infoValue}>
          {value}
        </strong>
      </div>
    </div>
  );
}


/* ==========================================================================
   PROFILE LINK
   ========================================================================== */

interface ProfileLinkProps {
  readonly label:
    string;
}


function ProfileLink({
  label,
}: ProfileLinkProps) {
  return (
    <Link
      href={PROFILE_ROUTE}
      className={styles.profileLink}
    >
      <span>
        {label}
      </span>

      <ArrowRight
        size={16}
        strokeWidth={1.9}
        aria-hidden="true"
      />
    </Link>
  );
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function GestionnaireSettingsPage() {
  /* =========================================================================
     1. DONNÉES DU PROFIL
     =========================================================================
     
     On ne recrée aucune requête spécifique Paramètres.
     
     Cette page utilise exactement la même source que :
     
     /gestionnaire/profil
     
     La sécurité, managerId et storeId restent entièrement gérés côté serveur
     par le module Profil existant.
     ========================================================================= */

  const data =
    await getGestionnaireProfilePageData();


  /* =========================================================================
     2. VALEURS D'AFFICHAGE
     ========================================================================= */

  const managerRole =
    getGestionnaireProfileRoleLabel(
      data.manager.role,
    );


  const managerStatus =
    getGestionnaireProfileManagerStatusLabel(
      data.manager.status,
    );


  const storeStatus =
    getGestionnaireProfileStoreStatusLabel(
      data.store.status,
    );


  const countryName =
    data.country?.name ??
    data.store.country ??
    "Non renseigné";


  const location =
    [
      data.store.city,
      countryName,
    ]
      .filter(
        Boolean,
      )
      .join(
        ", ",
      );


  const passwordChangedAt =
    data.security.passwordChangedAt
      ? formatDate(
          data.security.passwordChangedAt,
        )
      : "Jamais modifié";


  /* =========================================================================
     3. RENDER
     ========================================================================= */

  return (
    <div className={styles.page}>
      {/* ====================================================================
          BREADCRUMB
          ==================================================================== */}

      <nav
        className={styles.breadcrumb}
        aria-label="Fil d’Ariane"
      >
        <Link
          href={DASHBOARD_ROUTE}
          className={styles.breadcrumbLink}
        >
          Tableau de bord
        </Link>

        <ChevronRight
          size={14}
          strokeWidth={1.8}
          aria-hidden="true"
          className={styles.breadcrumbSeparator}
        />

        <span
          className={styles.breadcrumbCurrent}
          aria-current="page"
        >
          Paramètres
        </span>
      </nav>


      {/* ====================================================================
          HEADER
          ==================================================================== */}

      <header className={styles.pageHeader}>
        <div
          className={styles.pageHeaderIcon}
          aria-hidden="true"
        >
          <Settings
            size={24}
            strokeWidth={1.8}
          />
        </div>

        <div className={styles.pageHeaderContent}>
          <h1 className={styles.pageTitle}>
            Paramètres
          </h1>

          <p className={styles.pageDescription}>
            Consultez les informations principales de votre compte et de votre
            boutique. Les modifications sont centralisées dans votre profil.
          </p>
        </div>

        <ProfileLink
          label="Accéder à mon profil"
        />
      </header>


      {/* ====================================================================
          INFORMATION
          ==================================================================== */}

      <section
        className={styles.noticeCard}
        aria-label="Gestion centralisée des paramètres"
      >
        <div
          className={styles.noticeIcon}
          aria-hidden="true"
        >
          <ShieldCheck
            size={21}
            strokeWidth={1.8}
          />
        </div>

        <div className={styles.noticeContent}>
          <strong className={styles.noticeTitle}>
            Les modifications sont centralisées dans votre profil
          </strong>

          <p className={styles.noticeText}>
            Cette page consulte les mêmes informations que votre profil.
            Pour éviter les doublons et les incohérences, les changements de
            coordonnées et de mot de passe sont effectués uniquement depuis la
            page Mon profil.
          </p>
        </div>
      </section>


      {/* ====================================================================
          GRID
          ==================================================================== */}

      <div className={styles.settingsGrid}>
        {/* ================================================================
            COMPTE GESTIONNAIRE
            ================================================================ */}

        <section
          className={styles.settingsCard}
          aria-labelledby="settings-account-title"
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardHeading}>
              <div
                className={styles.cardIcon}
                aria-hidden="true"
              >
                <UserRound
                  size={20}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h2
                  id="settings-account-title"
                  className={styles.cardTitle}
                >
                  Compte Gestionnaire
                </h2>

                <p className={styles.cardSubtitle}>
                  Informations liées à votre accès privé.
                </p>
              </div>
            </div>

            <ProfileLink
              label="Voir le profil"
            />
          </div>


          <div className={styles.cardBody}>
            <SettingsInfoRow
              icon={Mail}
              label="E-mail de connexion"
              value={data.manager.email}
            />

            <SettingsInfoRow
              icon={ShieldCheck}
              label="Rôle"
              value={managerRole}
            />

            <SettingsInfoRow
              icon={CheckCircle2}
              label="État du compte"
              value={managerStatus}
            />

            <SettingsInfoRow
              icon={CalendarDays}
              label="Compte créé le"
              value={
                formatDate(
                  data.manager.createdAt,
                )
              }
            />
          </div>
        </section>


        {/* ================================================================
            BOUTIQUE
            ================================================================ */}

        <section
          className={styles.settingsCard}
          aria-labelledby="settings-store-title"
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardHeading}>
              <div
                className={styles.cardIcon}
                aria-hidden="true"
              >
                <Store
                  size={20}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h2
                  id="settings-store-title"
                  className={styles.cardTitle}
                >
                  Boutique
                </h2>

                <p className={styles.cardSubtitle}>
                  Coordonnées actuellement enregistrées.
                </p>
              </div>
            </div>

            <ProfileLink
              label="Modifier"
            />
          </div>


          <div className={styles.cardBody}>
            <SettingsInfoRow
              icon={Building2}
              label="Nom de la boutique"
              value={data.store.name}
            />

            <SettingsInfoRow
              icon={Phone}
              label="Téléphone"
              value={
                data.store.phone ||
                "Non renseigné"
              }
            />

            <SettingsInfoRow
              icon={MapPin}
              label="Localisation"
              value={
                location ||
                "Non renseignée"
              }
            />

            <SettingsInfoRow
              icon={CheckCircle2}
              label="État de la boutique"
              value={storeStatus}
            />
          </div>


          <div className={styles.addressBlock}>
            <span className={styles.addressLabel}>
              Adresse
            </span>

            <div className={styles.addressValue}>
              <MapPin
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span>
                {data.store.address ||
                  "Non renseignée"}
              </span>
            </div>
          </div>
        </section>


        {/* ================================================================
            SÉCURITÉ
            ================================================================ */}

        <section
          className={[
            styles.settingsCard,
            styles.securityCard,
          ].join(" ")}
          aria-labelledby="settings-security-title"
        >
          <div className={styles.cardHeader}>
            <div className={styles.cardHeading}>
              <div
                className={styles.cardIcon}
                aria-hidden="true"
              >
                <ShieldCheck
                  size={20}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h2
                  id="settings-security-title"
                  className={styles.cardTitle}
                >
                  Sécurité
                </h2>

                <p className={styles.cardSubtitle}>
                  État actuel de la sécurité de votre compte.
                </p>
              </div>
            </div>

            <ProfileLink
              label="Gérer la sécurité"
            />
          </div>


          <div className={styles.securityList}>
            {/* ==============================================================
                EMAIL
                ============================================================== */}

            <div className={styles.securityRow}>
              <div
                className={styles.securityIcon}
                aria-hidden="true"
              >
                <Mail
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

              <div className={styles.securityContent}>
                <strong>
                  Vérification e-mail
                </strong>

                <span>
                  {data.security.isEmailVerified
                    ? data.security.emailVerifiedAt
                      ? `Adresse vérifiée le ${formatDate(
                          data.security.emailVerifiedAt,
                        )}.`
                      : "Adresse e-mail vérifiée."
                    : "Adresse e-mail non vérifiée."}
                </span>
              </div>

              <span
                className={[
                  styles.statusBadge,
                  data.security.isEmailVerified
                    ? styles.statusBadgeSuccess
                    : styles.statusBadgeWarning,
                ].join(" ")}
              >
                {data.security.isEmailVerified
                  ? "Vérifié"
                  : "Non vérifié"}
              </span>
            </div>


            {/* ==============================================================
                PASSWORD
                ============================================================== */}

            <div className={styles.securityRow}>
              <div
                className={styles.securityIcon}
                aria-hidden="true"
              >
                <KeyRound
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

              <div className={styles.securityContent}>
                <strong>
                  Mot de passe
                </strong>

                <span>
                  Dernière modification : {passwordChangedAt}
                </span>
              </div>

              <Link
                href={PROFILE_ROUTE}
                className={styles.smallProfileLink}
              >
                Modifier

                <ArrowRight
                  size={15}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
              </Link>
            </div>


            {/* ==============================================================
                LAST LOGIN
                ============================================================== */}

            <div className={styles.securityRow}>
              <div
                className={styles.securityIcon}
                aria-hidden="true"
              >
                <Clock3
                  size={19}
                  strokeWidth={1.8}
                />
              </div>

              <div className={styles.securityContent}>
                <strong>
                  Dernière connexion
                </strong>

                <span>
                  {formatDateTime(
                    data.security.lastLoginAt,
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>


      {/* ====================================================================
          PROFILE MANAGEMENT
          ==================================================================== */}

      <section
        className={styles.profileManagementCard}
        aria-labelledby="settings-profile-management-title"
      >
        <div
          className={styles.profileManagementIcon}
          aria-hidden="true"
        >
          <Settings
            size={23}
            strokeWidth={1.8}
          />
        </div>

        <div className={styles.profileManagementContent}>
          <h2
            id="settings-profile-management-title"
            className={styles.profileManagementTitle}
          >
            Besoin de modifier une information ?
          </h2>

          <p className={styles.profileManagementText}>
            Les coordonnées de la boutique et la sécurité du compte sont
            administrées depuis votre profil afin de conserver une seule source
            de vérité dans votre espace Gestionnaire.
          </p>
        </div>

        <Link
          href={PROFILE_ROUTE}
          className={styles.primaryButton}
        >
          <UserRound
            size={17}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span>
            Ouvrir mon profil
          </span>

          <ArrowRight
            size={16}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </Link>
      </section>
    </div>
  );
}