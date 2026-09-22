import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  ArrowLeft,
  BadgePercent,
  CalendarClock,
  ChartNoAxesCombined,
  ChevronRight,
  Home,
  Sparkles,
  Tag,
} from "lucide-react";

import styles from "./promotions.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PROMOTIONS
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/promotions/page.tsx
 *
 * Route :
 *
 * /gestionnaire/promotions
 *
 *
 * OBJECTIF ACTUEL :
 *
 * Le module complet de gestion des promotions sera développé plus tard.
 *
 * Cette version permet simplement :
 *
 * - d'avoir une route Promotions fonctionnelle ;
 * - d'afficher une page propre dans l'espace Gestionnaire ;
 * - d'expliquer que le module est en préparation ;
 * - de présenter brièvement ce qui sera disponible ;
 * - de ne créer aucune fausse donnée ;
 * - de ne créer aucune fausse statistique ;
 * - de ne créer aucune Server Action inutile ;
 * - de ne créer aucune nouvelle route ;
 * - de ne pas dupliquer le layout Gestionnaire ;
 * - de ne pas dupliquer la sidebar ;
 * - de ne pas dupliquer le header ;
 * - de ne pas créer de second <main>.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE EXISTANTE
   ========================================================================== */

const DASHBOARD_ROUTE =
  "/gestionnaire/tableau-de-bord";


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata: Metadata = {
  title:
    "Promotions | Cosmetics Empire",

  description:
    "Espace de gestion des promotions de votre boutique Cosmetics Empire.",
};


/* ==========================================================================
   PAGE
   ========================================================================== */

export default function GestionnairePromotionsPage() {
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
          <Home
            size={15}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span>
            Tableau de bord
          </span>
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
          Promotions
        </span>
      </nav>


      {/* ====================================================================
          PAGE HEADER
          ==================================================================== */}

      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderContent}>
          <div
            className={styles.pageHeaderIcon}
            aria-hidden="true"
          >
            <Tag
              size={23}
              strokeWidth={1.8}
            />
          </div>

          <div className={styles.pageHeaderText}>
            <div className={styles.pageTitleRow}>
              <h1 className={styles.pageTitle}>
                Promotions
              </h1>

              <span className={styles.comingSoonBadge}>
                Bientôt disponible
              </span>
            </div>

            <p className={styles.pageDescription}>
              La gestion des promotions de votre boutique sera bientôt
              complète et opérationnelle dans cet espace.
            </p>
          </div>
        </div>
      </header>


      {/* ====================================================================
          INTRODUCTION
          ==================================================================== */}

      <section
        className={styles.introCard}
        aria-labelledby="promotions-coming-soon-title"
      >
        <div className={styles.introVisual}>
          <div
            className={styles.introIcon}
            aria-hidden="true"
          >
            <Sparkles
              size={31}
              strokeWidth={1.7}
            />
          </div>
        </div>

        <div className={styles.introContent}>
          <span className={styles.introEyebrow}>
            Module en préparation
          </span>

          <h2
            id="promotions-coming-soon-title"
            className={styles.introTitle}
          >
            La gestion des promotions arrive bientôt
          </h2>

          <p className={styles.introDescription}>
            Cette page accueillera prochainement les outils nécessaires pour
            préparer, organiser et suivre les promotions de votre boutique.
            Pour le moment, aucune configuration n’est nécessaire.
          </p>
        </div>
      </section>


      {/* ====================================================================
          FONCTIONNALITÉS À VENIR
          ==================================================================== */}

      <section
        className={styles.featuresSection}
        aria-labelledby="promotions-features-title"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2
              id="promotions-features-title"
              className={styles.sectionTitle}
            >
              Ce que vous retrouverez ici
            </h2>

            <p className={styles.sectionDescription}>
              Le module sera complété progressivement sans perturber le reste
              de votre espace Gestionnaire.
            </p>
          </div>
        </div>


        <div className={styles.featuresGrid}>
          {/* ================================================================
              CRÉATION
              ================================================================ */}

          <article className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              aria-hidden="true"
            >
              <BadgePercent
                size={22}
                strokeWidth={1.8}
              />
            </div>

            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>
                Créer des promotions
              </h3>

              <p className={styles.featureDescription}>
                Préparer les offres promotionnelles destinées aux produits de
                votre boutique.
              </p>
            </div>
          </article>


          {/* ================================================================
              PÉRIODES
              ================================================================ */}

          <article className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              aria-hidden="true"
            >
              <CalendarClock
                size={22}
                strokeWidth={1.8}
              />
            </div>

            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>
                Organiser les périodes
              </h3>

              <p className={styles.featureDescription}>
                Définir les périodes pendant lesquelles vos promotions seront
                disponibles.
              </p>
            </div>
          </article>


          {/* ================================================================
              SUIVI
              ================================================================ */}

          <article className={styles.featureCard}>
            <div
              className={styles.featureIcon}
              aria-hidden="true"
            >
              <ChartNoAxesCombined
                size={22}
                strokeWidth={1.8}
              />
            </div>

            <div className={styles.featureContent}>
              <h3 className={styles.featureTitle}>
                Suivre les promotions
              </h3>

              <p className={styles.featureDescription}>
                Consulter les informations liées aux promotions réellement
                créées lorsque le module sera activé.
              </p>
            </div>
          </article>
        </div>
      </section>


      {/* ====================================================================
          NOTICE
          ==================================================================== */}

      <section
        className={styles.noticeCard}
        aria-label="Information sur le module Promotions"
      >
        <div
          className={styles.noticeIcon}
          aria-hidden="true"
        >
          <Tag
            size={20}
            strokeWidth={1.8}
          />
        </div>

        <div className={styles.noticeContent}>
          <strong className={styles.noticeTitle}>
            Aucune action requise pour le moment
          </strong>

          <p className={styles.noticeText}>
            Votre espace Gestionnaire continue de fonctionner normalement
            pendant la préparation du module Promotions.
          </p>
        </div>

        <Link
          href={DASHBOARD_ROUTE}
          className={styles.backButton}
        >
          <ArrowLeft
            size={16}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span>
            Tableau de bord
          </span>
        </Link>
      </section>
    </div>
  );
}