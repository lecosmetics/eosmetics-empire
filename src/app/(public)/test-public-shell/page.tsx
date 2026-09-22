import type {
  Metadata,
} from "next";

import {
  ArrowDown,
  Check,
  Layers3,
  Monitor,
  MousePointerClick,
  PanelBottom,
  PanelTop,
  Search,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import {
  PUBLIC_SITE,
} from "@/config/public-site";

import styles from "./test-public-shell.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * TEST DU SHELL PUBLIC
 * ============================================================================
 *
 * Route :
 *
 * /test-public-shell
 *
 * Cette page sert exclusivement à tester l'interface publique.
 * Elle ne contient aucune donnée commerciale fictive.
 * ============================================================================
 */


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata: Metadata = {
  title:
    `Test du shell public | ${PUBLIC_SITE.brand.name}`,

  description:
    "Page interne de validation du shell public de Cosmetics Empire.",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


/* ==========================================================================
   TEST ITEMS
   ========================================================================== */

const SHELL_TEST_ITEMS =
  [
    {
      id:
        "responsive",

      icon:
        Monitor,

      title:
        "Responsive",

      description:
        "Vérifier le passage propre entre les interfaces mobile, tablette et ordinateur.",
    },

    {
      id:
        "sticky-header",

      icon:
        PanelTop,

      title:
        "Header sticky",

      description:
        "Faire défiler cette page et vérifier que le header reste correctement positionné en haut.",
    },

    {
      id:
        "mobile-navigation",

      icon:
        PanelBottom,

      title:
        "Navigation mobile",

      description:
        "Sur mobile, vérifier la barre fixe Accueil, Produits, Panier, Commandes et Compte.",
    },

    {
      id:
        "search",

      icon:
        Search,

      title:
        "Recherche",

      description:
        "Vérifier le champ de recherche, son focus clavier et son adaptation aux différentes largeurs.",
    },

    {
      id:
        "drawer",

      icon:
        MousePointerClick,

      title:
        "Menu mobile",

      description:
        "Ouvrir le menu hamburger, vérifier le drawer, l’overlay, le clavier et la fermeture.",
    },

    {
      id:
        "full-width",

      icon:
        Layers3,

      title:
        "Pleine largeur",

      description:
        "Vérifier que le shell utilise toute la largeur disponible sans être enfermé dans une petite colonne.",
    },

    {
      id:
        "accessibility",

      icon:
        ShieldCheck,

      title:
        "Accessibilité",

      description:
        "Tester Tab, Shift + Tab, Escape et les différents états de focus visibles.",
    },

    {
      id:
        "mobile",

      icon:
        Smartphone,

      title:
        "Petits écrans",

      description:
        "Vérifier notamment les largeurs 320 px, 360 px, 375 px, 390 px et 430 px.",
    },
  ] as const;


/* ==========================================================================
   VIEWPORTS
   ========================================================================== */

const VIEWPORTS =
  [
    "320 px",
    "360 px",
    "375 px",
    "390 px",
    "430 px",
    "768 px",
    "1024 px",
    "1366 px",
    "1440 px",
    "1920 px",
  ] as const;


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function TestPublicShellPage() {
  return (
    <div
      className={styles.page}
      data-test-public-shell-page="true"
    >
      {/* ====================================================================
          HERO
          ==================================================================== */}

      <section
        className={styles.hero}
        aria-labelledby="test-public-shell-title"
      >
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>
            Test interface publique
          </span>

          <h1
            id="test-public-shell-title"
            className={styles.title}
          >
            Shell public
            {" "}
            <span>
              {PUBLIC_SITE.brand.shortName}
            </span>
          </h1>

          <p className={styles.description}>
            Cette page permet de contrôler le comportement réel du
            header, du menu mobile, de la recherche, de la navigation
            basse et du footer avant de commencer les pages publiques
            de la boutique.
          </p>


          <div
            className={styles.heroStatus}
            aria-label="Éléments actuellement testés"
          >
            <span>
              <Check
                size={16}
                strokeWidth={2.2}
                aria-hidden="true"
              />

              Desktop
            </span>

            <span>
              <Check
                size={16}
                strokeWidth={2.2}
                aria-hidden="true"
              />

              Mobile
            </span>

            <span>
              <Check
                size={16}
                strokeWidth={2.2}
                aria-hidden="true"
              />

              Pleine largeur
            </span>
          </div>


          <div
            className={styles.scrollHint}
            aria-hidden="true"
          >
            <span>
              Faites défiler la page
            </span>

            <ArrowDown
              size={18}
              strokeWidth={1.8}
            />
          </div>
        </div>
      </section>


      {/* ====================================================================
          TEST AREAS
          ==================================================================== */}

      <section
        className={styles.section}
        aria-labelledby="shell-elements-title"
      >
        <div className={styles.sectionHeading}>
          <span className={styles.sectionEyebrow}>
            Contrôle du shell
          </span>

          <h2
            id="shell-elements-title"
            className={styles.sectionTitle}
          >
            Éléments à vérifier
          </h2>

          <p className={styles.sectionDescription}>
            Chaque bloc ci-dessous correspond à une partie importante
            de l’interface publique.
          </p>
        </div>


        <div className={styles.testGrid}>
          {SHELL_TEST_ITEMS.map(
            (
              item,
            ) => {
              const Icon =
                item.icon;


              return (
                <article
                  key={item.id}
                  className={styles.testCard}
                >
                  <span className={styles.testCardIcon}>
                    <Icon
                      size={22}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </span>

                  <div className={styles.testCardContent}>
                    <h3>
                      {item.title}
                    </h3>

                    <p>
                      {item.description}
                    </p>
                  </div>
                </article>
              );
            },
          )}
        </div>
      </section>


      {/* ====================================================================
          FULL WIDTH TEST BAND
          ==================================================================== */}

      <section
        className={styles.fullWidthBand}
        aria-labelledby="full-width-test-title"
      >
        <div className={styles.fullWidthBandContent}>
          <span className={styles.fullWidthBandNumber}>
            100%
          </span>

          <div>
            <h2 id="full-width-test-title">
              Test pleine largeur
            </h2>

            <p>
              Ce bandeau doit aller d’un bord de l’écran à l’autre,
              sans grande marge extérieure et sans conteneur global
              étroit.
            </p>
          </div>
        </div>
      </section>


      {/* ====================================================================
          VIEWPORT TEST
          ==================================================================== */}

      <section
        className={styles.section}
        aria-labelledby="viewport-test-title"
      >
        <div className={styles.sectionHeading}>
          <span className={styles.sectionEyebrow}>
            Responsive
          </span>

          <h2
            id="viewport-test-title"
            className={styles.sectionTitle}
          >
            Largeurs à contrôler
          </h2>

          <p className={styles.sectionDescription}>
            Ces valeurs servent uniquement de repères pour contrôler
            l’interface pendant le développement.
          </p>
        </div>


        <div className={styles.viewportGrid}>
          {VIEWPORTS.map(
            (
              viewport,
            ) => (
              <div
                key={viewport}
                className={styles.viewportCard}
              >
                <Monitor
                  size={18}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <span>
                  {viewport}
                </span>
              </div>
            ),
          )}
        </div>
      </section>


      {/* ====================================================================
          STICKY HEADER SCROLL TEST
          ==================================================================== */}

      <section
        className={styles.scrollTestSection}
        aria-labelledby="sticky-scroll-test-title"
      >
        <div className={styles.scrollTestIntro}>
          <span className={styles.sectionEyebrow}>
            Défilement
          </span>

          <h2
            id="sticky-scroll-test-title"
            className={styles.sectionTitle}
          >
            Vérification du header sticky
          </h2>

          <p className={styles.sectionDescription}>
            Cette zone fournit volontairement de la hauteur afin de
            contrôler que le header reste stable pendant un long
            défilement.
          </p>
        </div>


        <div className={styles.scrollTestBlocks}>
          <div className={styles.scrollTestBlock}>
            <span>
              01
            </span>

            <strong>
              Début du test
            </strong>

            <p>
              Le header doit rester visible sans masquer anormalement
              le contenu.
            </p>
          </div>


          <div className={styles.scrollTestBlock}>
            <span>
              02
            </span>

            <strong>
              Milieu du test
            </strong>

            <p>
              Vérifier qu’aucun élément du header ne change de largeur
              ou ne provoque de déplacement horizontal.
            </p>
          </div>


          <div className={styles.scrollTestBlock}>
            <span>
              03
            </span>

            <strong>
              Navigation mobile
            </strong>

            <p>
              Sur téléphone, la barre du bas doit rester fixe et le
              contenu doit rester lisible au-dessus d’elle.
            </p>
          </div>


          <div className={styles.scrollTestBlock}>
            <span>
              04
            </span>

            <strong>
              Zone sûre
            </strong>

            <p>
              Vérifier que les appareils disposant d’une zone système
              inférieure conservent suffisamment d’espace.
            </p>
          </div>
        </div>
      </section>


      {/* ====================================================================
          MOBILE TEST
          ==================================================================== */}

      <section
        className={styles.mobileTestSection}
        aria-labelledby="mobile-test-title"
      >
        <div className={styles.mobileTestIcon}>
          <Smartphone
            size={32}
            strokeWidth={1.6}
            aria-hidden="true"
          />
        </div>

        <div className={styles.mobileTestContent}>
          <span className={styles.sectionEyebrow}>
            Mobile
          </span>

          <h2
            id="mobile-test-title"
            className={styles.sectionTitle}
          >
            Testez maintenant le menu hamburger
          </h2>

          <p>
            Sur une largeur inférieure à 1024 px, ouvrez le menu
            mobile. Vérifiez l’overlay, le défilement interne, les
            catégories, les implantations, les contacts et la
            fermeture avec la touche Escape.
          </p>
        </div>
      </section>


      {/* ====================================================================
          FINAL SPACING / FOOTER TEST
          ==================================================================== */}

      <section
        className={styles.footerTestSection}
        aria-labelledby="footer-test-title"
      >
        <div className={styles.footerTestContent}>
          <span className={styles.sectionEyebrow}>
            Dernière vérification
          </span>

          <h2
            id="footer-test-title"
            className={styles.sectionTitle}
          >
            Le footer commence juste après cette zone
          </h2>

          <p>
            Vérifiez qu’il occupe toute la largeur de l’écran et que,
            sur mobile, son contenu n’est jamais caché derrière la
            navigation fixe du bas.
          </p>

          <div className={styles.footerTestArrow}>
            <ArrowDown
              size={24}
              strokeWidth={1.7}
              aria-hidden="true"
            />
          </div>
        </div>
      </section>
    </div>
  );
}