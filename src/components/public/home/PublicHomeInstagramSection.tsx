import Image from "next/image";

import {
  PUBLIC_HOME_INSTAGRAM_CONFIG,
} from "@/config/public-home";

import {
  PUBLIC_SITE,
} from "@/config/public-site";

import styles from "./public-home.module.css";


/**
 * ============================================================================
 * ICÔNE INSTAGRAM
 * ============================================================================
 *
 * SVG local afin de ne dépendre d’aucune icône de marque absente
 * de la version installée de lucide-react.
 *
 * La couleur est héritée depuis CSS avec currentColor.
 */
function InstagramBrandIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
      />

      <circle
        cx="17.4"
        cy="6.7"
        r="1.1"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * HOME PUBLIQUE — SECTION INSTAGRAM OFFICIELLE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/home/PublicHomeInstagramSection.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Reproduire exactement le bloc Instagram visible en bas de l’architecture
 * officielle de la page d’accueil, juste avant le Footer public.
 *
 * ============================================================================
 *
 * IMAGE OFFICIELLE
 *
 * /images/baimage.png
 *
 * Cette image est utilisée UNE SEULE FOIS.
 *
 * Aucun découpage artificiel.
 * Aucun carousel.
 * Aucune répétition d’image.
 * Aucune galerie générée.
 *
 * ============================================================================
 *
 * ARCHITECTURE DESKTOP
 *
 * ┌─────────────────────┬───────────────────────────────────────────────┐
 * │  Instagram          │                                               │
 * │  Suivez-nous sur    │              baimage.png                     │
 * │  Instagram          │                                               │
 * │  @compte            │                                               │
 * └─────────────────────┴───────────────────────────────────────────────┘
 *
 * ============================================================================
 *
 * ARCHITECTURE MOBILE
 *
 * ┌──────────────────────────────────────┐
 * │   Instagram                         │
 * │   Suivez-nous sur Instagram         │
 * │   @compte                           │
 * ├──────────────────────────────────────┤
 * │                                      │
 * │            baimage.png               │
 * │                                      │
 * └──────────────────────────────────────┘
 *
 * ============================================================================
 *
 * SOURCES DE VÉRITÉ
 *
 * Structure Home :
 *
 * src/config/public-home.ts
 *
 * Identité / réseaux sociaux :
 *
 * src/config/public-site.ts
 *
 * Styles :
 *
 * src/components/public/home/public-home.module.css
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - reste un Server Component ;
 * - n’utilise pas "use client" ;
 * - n’utilise pas useState ;
 * - n’utilise pas useEffect ;
 * - n’interroge pas Prisma ;
 * - n’invente aucun compte Instagram ;
 * - n’invente aucune URL Instagram ;
 * - ne duplique pas baimage.png ;
 * - ne crée aucune galerie artificielle ;
 * - ne crée aucun carousel ;
 * - ne crée aucun faux post Instagram ;
 * - ne crée aucun faux nombre d’abonnés ;
 * - ne crée aucun compteur ;
 * - ne crée aucun témoignage ;
 * - ne crée aucune section supplémentaire.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. IDENTIFIANT ACCESSIBILITÉ
   ========================================================================== */

const INSTAGRAM_TITLE_ID =
  `${PUBLIC_HOME_INSTAGRAM_CONFIG.sectionId}-title`;


/* ==========================================================================
   2. TYPES INTERNES
   ========================================================================== */

/**
 * On ne dépend pas ici d’une forme particulière supplémentaire de
 * PUBLIC_SITE.socials.
 *
 * La configuration officielle peut être :
 *
 * - un tableau de réseaux ;
 * - un objet indexé par plateforme.
 *
 * Le résolveur ci-dessous lit uniquement les informations réellement
 * présentes.
 */
type UnknownRecord =
  Record<
    string,
    unknown
  >;


interface ResolvedInstagramSocial {
  readonly href:
    string;

  readonly handle:
    string;
}


/* ==========================================================================
   3. HELPERS GÉNÉRIQUES
   ========================================================================== */

function isRecord(
  value:
    unknown,
): value is UnknownRecord {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}


function normalizeText(
  value:
    unknown,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }


  return value.trim();
}


function getFirstString(
  source:
    UnknownRecord,

  keys:
    readonly string[],
): string {
  for (
    const key
    of keys
  ) {
    const value =
      normalizeText(
        source[key],
      );


    if (
      value.length >
      0
    ) {
      return value;
    }
  }


  return "";
}


/* ==========================================================================
   4. IDENTIFICATION D’UNE ENTRÉE INSTAGRAM
   ========================================================================== */

function isInstagramRecord(
  source:
    UnknownRecord,

  fallbackKey?:
    string,
): boolean {
  const identityCandidates = [
    fallbackKey,
    source.id,
    source.key,
    source.name,
    source.label,
    source.platform,
    source.network,
    source.type,
  ];


  return identityCandidates.some(
    (
      value,
    ) =>
      normalizeText(
        value,
      )
        .toLowerCase()
        .includes(
          "instagram",
        ),
  );
}


/* ==========================================================================
   5. NORMALISATION DU HANDLE
   ========================================================================== */

function normalizeInstagramHandle(
  value:
    string,
): string {
  const normalized =
    value.trim();


  if (
    normalized.length ===
    0
  ) {
    return "";
  }


  if (
    normalized.startsWith(
      "@",
    )
  ) {
    return normalized;
  }


  return `@${normalized}`;
}


/* ==========================================================================
   6. HANDLE DEPUIS UNE URL INSTAGRAM
   ========================================================================== */

/**
 * Si PUBLIC_SITE contient uniquement l’URL Instagram mais pas de champ
 * handle/username séparé, on peut récupérer le nom du compte depuis cette
 * même URL officielle.
 *
 * Aucune valeur externe n’est inventée.
 */
function getHandleFromInstagramHref(
  href:
    string,
): string {
  if (
    href.length ===
    0
  ) {
    return "";
  }


  try {
    const url =
      new URL(
        href,
      );


    const pathSegments =
      url.pathname
        .split(
          "/",
        )
        .map(
          (
            segment,
          ) =>
            segment.trim(),
        )
        .filter(
          Boolean,
        );


    const username =
      pathSegments[0] ??
      "";


    if (
      username.length ===
      0
    ) {
      return "";
    }


    return normalizeInstagramHandle(
      username,
    );
  }
  catch {
    return "";
  }
}


/* ==========================================================================
   7. RÉSOLUTION D’UNE ENTRÉE INSTAGRAM
   ========================================================================== */

function resolveInstagramRecord(
  source:
    UnknownRecord,
): ResolvedInstagramSocial |
  null {
  const href =
    getFirstString(
      source,
      [
        "href",
        "url",
        "link",
      ],
    );


  if (
    href.length ===
    0
  ) {
    return null;
  }


  const explicitHandle =
    getFirstString(
      source,
      [
        "handle",
        "username",
        "userName",
        "account",
      ],
    );


  const handle =
    explicitHandle.length >
      0
      ? normalizeInstagramHandle(
          explicitHandle,
        )
      : getHandleFromInstagramHref(
          href,
        );


  if (
    handle.length ===
    0
  ) {
    return null;
  }


  return {
    href,

    handle,
  };
}


/* ==========================================================================
   8. RÉSOLUTION DEPUIS PUBLIC_SITE
   ========================================================================== */

/**
 * Recherche Instagram exclusivement dans PUBLIC_SITE.socials.
 *
 * On supporte proprement :
 *
 * PUBLIC_SITE.socials = [
 *   { id: "instagram", href: "...", handle: "..." }
 * ]
 *
 * ou :
 *
 * PUBLIC_SITE.socials = {
 *   instagram: {
 *     href: "...",
 *     handle: "..."
 *   }
 * }
 *
 * Aucun compte de secours n’est écrit en dur.
 */
function resolveInstagramSocial():
  ResolvedInstagramSocial |
  null {
  const socials:
    unknown =
      PUBLIC_SITE.socials;


  /* ------------------------------------------------------------------------
     FORMAT TABLEAU
     ------------------------------------------------------------------------ */

  if (
    Array.isArray(
      socials,
    )
  ) {
    for (
      const social
      of socials
    ) {
      if (
        !isRecord(
          social,
        )
      ) {
        continue;
      }


      if (
        !isInstagramRecord(
          social,
        )
      ) {
        continue;
      }


      const resolved =
        resolveInstagramRecord(
          social,
        );


      if (
        resolved
      ) {
        return resolved;
      }
    }


    return null;
  }


  /* ------------------------------------------------------------------------
     FORMAT OBJET
     ------------------------------------------------------------------------ */

  if (
    !isRecord(
      socials,
    )
  ) {
    return null;
  }


  for (
    const [
      key,
      value,
    ]
    of Object.entries(
      socials,
    )
  ) {
    if (
      typeof value ===
      "string"
    ) {
      if (
        key
          .toLowerCase()
          .includes(
            "instagram",
          )
      ) {
        const href =
          normalizeText(
            value,
          );


        const handle =
          getHandleFromInstagramHref(
            href,
          );


        if (
          href &&
          handle
        ) {
          return {
            href,

            handle,
          };
        }
      }


      continue;
    }


    if (
      !isRecord(
        value,
      )
    ) {
      continue;
    }


    if (
      !isInstagramRecord(
        value,
        key,
      )
    ) {
      continue;
    }


    const resolved =
      resolveInstagramRecord(
        value,
      );


    if (
      resolved
    ) {
      return resolved;
    }
  }


  return null;
}


/* ==========================================================================
   9. BLOC TEXTE INSTAGRAM
   ========================================================================== */

interface PublicHomeInstagramMetaProps {
  readonly social:
    ResolvedInstagramSocial |
    null;
}


function PublicHomeInstagramMeta({
  social,
}: PublicHomeInstagramMetaProps) {
  const config =
    PUBLIC_HOME_INSTAGRAM_CONFIG;


  return (
    <div
      className={
        styles.instagramMeta
      }
    >
      {/* =================================================================
          ICÔNE OFFICIELLE
          ================================================================= */}

      <span
        className={
          styles.instagramIcon
        }
        aria-hidden="true"
      >
        <InstagramBrandIcon />
      </span>


      {/* =================================================================
          TEXTE
          ================================================================= */}

      <div
        className={
          styles.instagramCopy
        }
      >
        <h2
          id={
            INSTAGRAM_TITLE_ID
          }
          className={
            styles.instagramTitle
          }
        >
          {
            config.title
          }
        </h2>


        {/* ===============================================================
            COMPTE OFFICIEL
            ===============================================================
            Aucun handle de démonstration.

            Si PUBLIC_SITE ne contient pas un Instagram exploitable,
            aucun faux compte n’est affiché.
            =============================================================== */}

        {social ? (
          <a
            href={
              social.href
            }
            className={
              styles.instagramHandle
            }
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              `${config.title} ${social.handle}`
            }
          >
            {
              social.handle
            }
          </a>
        ) : null}
      </div>
    </div>
  );
}


/* ==========================================================================
   10. IMAGE OFFICIELLE
   ========================================================================== */

function PublicHomeInstagramArtwork() {
  const config =
    PUBLIC_HOME_INSTAGRAM_CONFIG;


  return (
    <div
      className={
        styles.instagramImageFrame
      }
    >
      <Image
        src={
          config.image.src
        }
        alt={
          config.image.alt
        }
        fill
        priority={
          config.image.priority
        }
        sizes="
          (max-width: 767px) 100vw,
          (max-width: 1023px) 68vw,
          900px
        "
        className={
          styles.instagramImage
        }
      />
    </div>
  );
}


/* ==========================================================================
   11. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicHomeInstagramSection() {
  const config =
    PUBLIC_HOME_INSTAGRAM_CONFIG;


  /**
   * Le compte est résolu depuis la source officielle de l’entreprise.
   *
   * Aucune valeur Instagram n’est dupliquée dans ce composant.
   */
  const instagramSocial =
    resolveInstagramSocial();


  return (
    <section
      id={
        config.sectionId
      }
      className={
        styles.instagramSection
      }
      aria-labelledby={
        INSTAGRAM_TITLE_ID
      }
    >
      <div
        className={
          styles.instagramInner
        }
      >
        {/* ===============================================================
            TEXTE / INSTAGRAM
            =============================================================== */}

        <PublicHomeInstagramMeta
          social={
            instagramSocial
          }
        />


        {/* ===============================================================
            VISUEL UNIQUE
            ===============================================================
            
            /images/baimage.png

            Une seule occurrence.
            =============================================================== */}

        <PublicHomeInstagramArtwork />
      </div>
    </section>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * GARANTIES DE CE COMPOSANT
 *
 * STRUCTURE
 *
 * Desktop :
 *
 * [ Instagram / compte ] [ baimage.png ]
 *
 * Mobile :
 *
 * [ Instagram / compte ]
 * [     baimage.png     ]
 *
 * IMAGE
 *
 * - /images/baimage.png ;
 * - une seule utilisation ;
 * - aucune copie mobile ;
 * - aucune copie desktop ;
 * - aucun découpage ;
 * - aucun faux post ;
 * - aucun carousel.
 *
 * SOCIAL
 *
 * - informations provenant exclusivement de PUBLIC_SITE.socials ;
 * - aucun username inventé ;
 * - aucune URL inventée ;
 * - aucun nombre d’abonnés inventé.
 *
 * RESPONSABILITÉS
 *
 * - aucune requête Prisma ;
 * - aucune requête réseau ;
 * - aucun état React ;
 * - aucun JavaScript client ;
 * - aucun contenu supplémentaire.
 *
 * ============================================================================
 */