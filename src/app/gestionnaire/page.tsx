import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import GestionnaireHeader from "@/components/gestionnaire/GestionnaireHeader";

import {
  gestionnaireAccessCard,
  gestionnaireBenefits,
  gestionnaireBenefitsSection,
  gestionnaireFeatures,
  gestionnaireHero,
  gestionnairePresence,
  gestionnaireStats,
  type GestionnaireBenefitIcon,
  type GestionnaireFeatureIcon,
  type GestionnaireStatIcon,
} from "@/config/gestionnaire";


/* ============================================================
   COSMETICS EMPIRE
   /gestionnaire
   ------------------------------------------------------------
   Page d'entrée officielle de l'espace Gestionnaire.

   RESPONSABILITÉS :

   - contenu              → config/gestionnaire.ts
   - routes               → config/routes.ts
   - design global        → app/globals.css
   - design gestionnaire  → gestionnaire.css
   - navigation           → GestionnaireHeader.tsx
   - composition          → ce fichier

   Aucun style de marque n'est défini directement ici.
   ============================================================ */


/* ============================================================
   METADATA
   ============================================================ */

export const metadata: Metadata = {
  title: "Espace Gestionnaire",

  description:
    "Rejoignez l'espace Gestionnaire Cosmetics Empire et gérez votre activité professionnelle.",

  alternates: {
    canonical: "/gestionnaire",
  },
};


/* ============================================================
   ICON TYPES
   ============================================================ */

type IconProps = Readonly<{
  className?: string;
}>;

type IconSvgProps = IconProps &
  Readonly<{
    children: ReactNode;
  }>;


/* ============================================================
   GENERIC SVG
   ============================================================ */

function IconSvg({
  className,
  children,
}: IconSvgProps) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}


/* ============================================================
   FEATURE ICONS
   ============================================================ */

function PackageIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <path
        d="M4 7.5L12 3L20 7.5V16.5L12 21L4 16.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M4.5 7.75L12 12L19.5 7.75"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M12 12V20.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconSvg>
  );
}


function ShoppingCartIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <path
        d="M3 4H5L7.2 14.1C7.4 15 8.2 15.6 9.1 15.6H17.3C18.1 15.6 18.8 15.1 19.1 14.3L21 8H6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="9.5"
        cy="19"
        r="1.25"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <circle
        cx="17"
        cy="19"
        r="1.25"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </IconSvg>
  );
}


function QrCodeIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <rect
        x="3.5"
        y="3.5"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="14.5"
        y="3.5"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <rect
        x="3.5"
        y="14.5"
        width="6"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M14 14H17V17H20.5M14 20.5V17.5H17.5V20.5M20.5 14V15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconSvg>
  );
}


function TruckIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <path
        d="M3 6H14V17H3V6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M14 10H18L21 13V17H14V10Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle
        cx="7"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="17.5"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </IconSvg>
  );
}


function ChartIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <path
        d="M4 19V11M10 19V5M16 19V9M22 19V3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M3 19.5H22"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconSvg>
  );
}


/* ============================================================
   STAT ICONS
   ============================================================ */

function StoreIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <path
        d="M4 9V20H20V9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M3 9L5 4H19L21 9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 20V14H16V20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M3 9C3 10.7 4.3 12 6 12C7.3 12 8.4 11.2 8.8 10C9.2 11.2 10.3 12 11.6 12C13 12 14.1 11.2 14.5 10C14.9 11.2 16 12 17.4 12C19.1 12 20.5 10.7 20.5 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </IconSvg>
  );
}


function UsersIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3.5 19C3.8 15.9 5.8 14 9 14C12.2 14 14.2 15.9 14.5 19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M15 5.5C17.2 5.5 18.5 7 18.5 8.5C18.5 10.1 17.3 11.3 15.8 11.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M16 14C18.9 14.2 20.4 16 20.5 18.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconSvg>
  );
}


function GlobeIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3 12H21M12 3C14.4 5.5 15.5 8.5 15.5 12C15.5 15.5 14.4 18.5 12 21M12 3C9.6 5.5 8.5 8.5 8.5 12C8.5 15.5 9.6 18.5 12 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconSvg>
  );
}


function HeartIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <path
        d="M20.8 5.9C19.4 4.5 17.1 4.5 15.7 5.9L12 9.6L8.3 5.9C6.9 4.5 4.6 4.5 3.2 5.9C1.7 7.4 1.7 9.8 3.2 11.3L12 20L20.8 11.3C22.3 9.8 22.3 7.4 20.8 5.9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconSvg>
  );
}


/* ============================================================
   BENEFIT ICONS
   ============================================================ */

function DiamondIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <path
        d="M4 8L8 3H16L20 8L12 21L4 8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M4 8H20M8 3L10 8L12 21M16 3L14 8L12 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </IconSvg>
  );
}


function SettingsIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M19 13.5V10.5L16.9 9.7C16.7 9.1 16.4 8.5 16 8L16.9 5.9L14.1 4.3L12.7 6C12.2 5.9 11.6 5.9 11.1 6L9.8 4.3L7 5.9L7.8 8C7.4 8.5 7.1 9.1 6.9 9.7L4.8 10.5V13.5L6.9 14.3C7.1 14.9 7.4 15.5 7.8 16L7 18.1L9.8 19.7L11.1 18C11.7 18.1 12.2 18.1 12.8 18L14.1 19.7L16.9 18.1L16 16C16.4 15.5 16.7 14.9 16.9 14.3L19 13.5Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
    </IconSvg>
  );
}


function HeadphonesIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <path
        d="M4 13V11C4 6.6 7.6 3 12 3C16.4 3 20 6.6 20 11V13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M4 12H6.5C7.3 12 8 12.7 8 13.5V17C8 17.8 7.3 18.5 6.5 18.5H5.5C4.7 18.5 4 17.8 4 17V12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M20 12H17.5C16.7 12 16 12.7 16 13.5V17C16 17.8 16.7 18.5 17.5 18.5H18.5C19.3 18.5 20 17.8 20 17V12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M16 18.5C15.3 20.1 14 21 12 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconSvg>
  );
}


/* ============================================================
   ACCESS CARD ICONS
   ============================================================ */

function LockIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconSvg>
  );
}


function LoginIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <path
        d="M10 5H6.5C5.67 5 5 5.67 5 6.5V17.5C5 18.33 5.67 19 6.5 19H10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M13 8L17 12L13 16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M17 12H9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconSvg>
  );
}


function UserIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5 20C5.4 15.8 7.9 13.5 12 13.5C16.1 13.5 18.6 15.8 19 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </IconSvg>
  );
}


function ArrowRightIcon({
  className,
}: IconProps) {
  return (
    <IconSvg className={className}>
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconSvg>
  );
}


/* ============================================================
   ICON RESOLVERS
   ============================================================ */

function FeatureIcon({
  icon,
}: Readonly<{
  icon: GestionnaireFeatureIcon;
}>) {
  switch (icon) {
    case "package":
      return <PackageIcon />;

    case "shopping-cart":
      return <ShoppingCartIcon />;

    case "qr-code":
      return <QrCodeIcon />;

    case "truck":
      return <TruckIcon />;

    case "chart":
      return <ChartIcon />;

    default:
      return null;
  }
}


function StatIcon({
  icon,
}: Readonly<{
  icon: GestionnaireStatIcon;
}>) {
  switch (icon) {
    case "store":
      return <StoreIcon />;

    case "users":
      return <UsersIcon />;

    case "globe":
      return <GlobeIcon />;

    case "heart":
      return <HeartIcon />;

    default:
      return null;
  }
}


function BenefitIcon({
  icon,
}: Readonly<{
  icon: GestionnaireBenefitIcon;
}>) {
  switch (icon) {
    case "diamond":
      return <DiamondIcon />;

    case "settings":
      return <SettingsIcon />;

    case "headphones":
      return <HeadphonesIcon />;

    case "chart":
      return <ChartIcon />;

    default:
      return null;
  }
}


/* ============================================================
   WORLD MAP DECORATION
   ============================================================ */

function WorldMapDecoration() {
  return (
    <svg
      className="gestionnaire-presence__map-svg"
      viewBox="0 0 760 390"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* North America */}

      <path
        d="
          M74 92
          C93 60 137 44 180 49
          C211 52 231 66 253 81
          L244 100
          L222 105
          L210 126
          L187 132
          L173 151
          L146 147
          L133 126
          L108 119
          L92 104
          Z
        "
        fill="currentColor"
      />


      {/* Central America */}

      <path
        d="
          M172 151
          L191 157
          L198 171
          L185 182
          L172 173
          L163 159
          Z
        "
        fill="currentColor"
      />


      {/* South America */}

      <path
        d="
          M197 181
          C222 177 250 193 260 215
          L252 244
          L239 267
          L228 299
          L209 334
          L195 314
          L188 282
          L177 257
          L181 223
          L169 201
          Z
        "
        fill="currentColor"
      />


      {/* Europe */}

      <path
        d="
          M356 84
          L387 71
          L415 80
          L427 96
          L415 109
          L391 105
          L379 118
          L357 108
          L346 95
          Z
        "
        fill="currentColor"
      />


      {/* Africa */}

      <path
        d="
          M356 123
          C379 107 418 108 443 129
          L456 158
          L449 194
          L432 225
          L416 263
          L390 247
          L373 220
          L357 184
          L343 153
          Z
        "
        fill="currentColor"
      />


      {/* Asia */}

      <path
        d="
          M423 83
          C465 53 538 47 602 67
          L650 91
          L669 117
          L650 137
          L621 132
          L604 149
          L574 139
          L553 153
          L528 142
          L506 125
          L474 128
          L450 109
          Z
        "
        fill="currentColor"
      />


      {/* India */}

      <path
        d="
          M515 143
          L547 151
          L539 183
          L520 205
          L507 179
          Z
        "
        fill="currentColor"
      />


      {/* South-East Asia */}

      <path
        d="
          M568 163
          L589 169
          L601 187
          L591 204
          L574 195
          L565 178
          Z
        "
        fill="currentColor"
      />


      {/* Australia */}

      <path
        d="
          M605 246
          C629 226 666 226 691 243
          L699 269
          L680 291
          L646 296
          L620 281
          Z
        "
        fill="currentColor"
      />


      {/* Greenland */}

      <path
        d="
          M249 31
          L289 22
          L309 43
          L296 69
          L263 66
          L243 50
          Z
        "
        fill="currentColor"
      />


      {/* Madagascar */}

      <path
        d="
          M454 240
          L466 253
          L461 283
          L449 274
          Z
        "
        fill="currentColor"
      />


      {/* Japan */}

      <path
        d="
          M652 123
          L662 116
          L667 131
          L658 143
          Z
        "
        fill="currentColor"
      />


      {/* Decorative markers */}

      <g className="gestionnaire-presence__map-marker">
        <circle
          className="gestionnaire-presence__map-marker-ring"
          cx="407"
          cy="171"
          r="14"
        />

        <circle
          className="gestionnaire-presence__map-marker-core"
          cx="407"
          cy="171"
          r="4"
        />
      </g>

      <g className="gestionnaire-presence__map-marker">
        <circle
          className="gestionnaire-presence__map-marker-ring"
          cx="389"
          cy="103"
          r="12"
        />

        <circle
          className="gestionnaire-presence__map-marker-core"
          cx="389"
          cy="103"
          r="4"
        />
      </g>

      <g className="gestionnaire-presence__map-marker">
        <circle
          className="gestionnaire-presence__map-marker-ring"
          cx="525"
          cy="116"
          r="13"
        />

        <circle
          className="gestionnaire-presence__map-marker-core"
          cx="525"
          cy="116"
          r="4"
        />
      </g>
    </svg>
  );
}


/* ============================================================
   PAGE
   ============================================================ */

export default function GestionnairePage() {
  return (
    <div className="gestionnaire-page">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <GestionnaireHeader />


      <main>
        {/* ====================================================
            HERO
            ==================================================== */}

        <section
          className="gestionnaire-hero"
          aria-labelledby="gestionnaire-hero-title"
        >
          <div className="gestionnaire-hero__container">
            {/* ================================================
                HERO BACKGROUND IMAGE
                ------------------------------------------------
                Desktop :
                l'image occupe tout le Hero derrière les
                contenus.

                Mobile :
                gestionnaire.css replace cette zone dans le
                flux pour conserver une composition lisible.
                ================================================ */}

            <div
              className="gestionnaire-hero__visual"
              aria-hidden="true"
            >
              <Image
                src={gestionnaireHero.image.src}
                alt=""
                fill
                priority
                quality={92}
                className="gestionnaire-hero__image"
                sizes="100vw"
              />
            </div>


            {/* ================================================
                HERO CONTENT
                ================================================ */}

            <div className="gestionnaire-hero__content">
              <p className="ce-eyebrow gestionnaire-hero__eyebrow">
                {gestionnaireHero.eyebrow}
              </p>

              <h1
                id="gestionnaire-hero-title"
                className="gestionnaire-hero__title"
              >
                <span className="gestionnaire-hero__title-line">
                  {gestionnaireHero.title.firstLine}
                </span>

                <span className="gestionnaire-hero__title-brand">
                  {gestionnaireHero.title.secondLine}
                </span>
              </h1>

              <p className="gestionnaire-hero__description">
                {gestionnaireHero.description}
              </p>


              {/* ==============================================
                  FEATURES
                  ============================================== */}

              <ul
                className="gestionnaire-hero__features"
                aria-label="Fonctionnalités de l'espace gestionnaire"
              >
                {gestionnaireFeatures.map((feature) => (
                  <li
                    key={feature.id}
                    className="gestionnaire-hero__feature"
                  >
                    <span
                      className="gestionnaire-hero__feature-icon"
                      aria-hidden="true"
                    >
                      <FeatureIcon icon={feature.icon} />
                    </span>

                    <span>
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>


              {/* ==============================================
                  SIGNATURE / QUOTE
                  ============================================== */}

              <div className="gestionnaire-hero__signature">
                <p className="gestionnaire-hero__signature-title">
                  <span className="gestionnaire-hero__signature-line">
                    {gestionnaireHero.signature.firstLine}
                  </span>

                  <span className="gestionnaire-hero__signature-line">
                    {gestionnaireHero.signature.secondLine}
                  </span>
                </p>

                <p className="gestionnaire-hero__quote">
                  “{gestionnaireHero.quote}”
                </p>
              </div>
            </div>


            {/* ================================================
                ACCESS CARD
                ================================================ */}

            <aside
              className="gestionnaire-hero__access"
              aria-label="Accès à l'espace Gestionnaire"
            >
              <div className="gestionnaire-access-card">
                {/* --------------------------------------------
                    EXISTING ACCOUNT
                    -------------------------------------------- */}

                <div className="gestionnaire-access-card__existing">
                  <div className="gestionnaire-access-card__content">
                    <h2 className="gestionnaire-access-card__title">
                      {
                        gestionnaireAccessCard
                          .existingAccount
                          .title
                      }
                    </h2>

                    <p className="gestionnaire-access-card__description">
                      {
                        gestionnaireAccessCard
                          .existingAccount
                          .description
                      }
                    </p>

                    <Link
                      href={
                        gestionnaireAccessCard
                          .existingAccount
                          .button
                          .href
                      }
                      className="
                        ce-button
                        ce-button-primary
                        ce-button-lg
                        gestionnaire-access-card__button
                      "
                    >
                      <LoginIcon />

                      <span>
                        {
                          gestionnaireAccessCard
                            .existingAccount
                            .button
                            .label
                        }
                      </span>

                      <ArrowRightIcon />
                    </Link>
                  </div>
                </div>


                {/* --------------------------------------------
                    SEPARATOR
                    -------------------------------------------- */}

                <div
                  className="gestionnaire-access-card__separator"
                  aria-hidden="true"
                >
                  <span>
                    {gestionnaireAccessCard.separator}
                  </span>
                </div>


                {/* --------------------------------------------
                    NEW ACCOUNT
                    -------------------------------------------- */}

                <div className="gestionnaire-access-card__new">
                  <div className="gestionnaire-access-card__content">
                    <p className="gestionnaire-access-card__description">
                      {
                        gestionnaireAccessCard
                          .newAccount
                          .description
                      }
                    </p>

                    <Link
                      href={
                        gestionnaireAccessCard
                          .newAccount
                          .button
                          .href
                      }
                      className="
                        ce-button
                        ce-button-lg
                        gestionnaire-access-card__register-button
                      "
                    >
                      <UserIcon />

                      <span>
                        {
                          gestionnaireAccessCard
                            .newAccount
                            .button
                            .label
                        }
                      </span>

                      <ArrowRightIcon />
                    </Link>
                  </div>
                </div>


                {/* --------------------------------------------
                    SECURITY
                    -------------------------------------------- */}

                <div className="gestionnaire-access-card__security">
                  <LockIcon className="gestionnaire-access-card__security-icon" />

                  <span>
                    {gestionnaireAccessCard.security.label}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </section>


        {/* ====================================================
            STATISTICS
            ==================================================== */}

        <section
          className="gestionnaire-stats"
          aria-label="Réseau Cosmetics Empire"
        >
          <div className="gestionnaire-stats__container">
            {gestionnaireStats.map((stat) => (
              <article
                key={stat.id}
                className="gestionnaire-stats__item"
              >
                <div
                  className="gestionnaire-stats__icon"
                  aria-hidden="true"
                >
                  <StatIcon icon={stat.icon} />
                </div>

                <div className="gestionnaire-stats__content">
                  <strong className="gestionnaire-stats__value">
                    {stat.value}
                  </strong>

                  <span className="gestionnaire-stats__label">
                    {stat.label}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>


        {/* ====================================================
            BENEFITS
            ==================================================== */}

        <section
          className="gestionnaire-benefits"
          aria-labelledby="gestionnaire-benefits-title"
        >
          <div className="gestionnaire-benefits__container">
            {/* -----------------------------------------------
                BENEFITS INTRO
                ----------------------------------------------- */}

            <header className="gestionnaire-benefits__header">
              <h2
                id="gestionnaire-benefits-title"
                className="gestionnaire-benefits__title"
              >
                {gestionnaireBenefitsSection.title}
              </h2>

              <p className="gestionnaire-benefits__description">
                {gestionnaireBenefitsSection.description}
              </p>
            </header>


            {/* -----------------------------------------------
                BENEFIT CARDS
                ----------------------------------------------- */}

            <div className="gestionnaire-benefits__grid">
              {gestionnaireBenefits.map((benefit) => (
                <article
                  key={benefit.id}
                  className="gestionnaire-benefits__card"
                >
                  <div
                    className="gestionnaire-benefits__icon"
                    aria-hidden="true"
                  >
                    <BenefitIcon icon={benefit.icon} />
                  </div>

                  <h3 className="gestionnaire-benefits__card-title">
                    {benefit.title}
                  </h3>

                  <p className="gestionnaire-benefits__card-description">
                    {benefit.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>


        {/* ====================================================
            INTERNATIONAL PRESENCE
            ==================================================== */}

        <section
          className="gestionnaire-presence"
          aria-labelledby="gestionnaire-presence-title"
        >
          <div className="gestionnaire-presence__container">
            {/* -----------------------------------------------
                MAP
                ----------------------------------------------- */}

            <div
              className="gestionnaire-presence__map"
              aria-hidden="true"
            >
              <WorldMapDecoration />
            </div>


            {/* -----------------------------------------------
                CONTENT
                ----------------------------------------------- */}

            <div className="gestionnaire-presence__content">
              <h2
                id="gestionnaire-presence-title"
                className="gestionnaire-presence__title"
              >
                <span className="gestionnaire-presence__title-line">
                  {gestionnairePresence.title.firstLine}
                </span>

                <span className="gestionnaire-presence__title-line">
                  {gestionnairePresence.title.secondLine}
                </span>
              </h2>

              <p className="gestionnaire-presence__description">
                {gestionnairePresence.description}
              </p>

              <Link
                href={gestionnairePresence.button.href}
                className="
                  ce-button
                  ce-button-lg
                  gestionnaire-presence__button
                "
              >
                <span>
                  {gestionnairePresence.button.label}
                </span>

                <ArrowRightIcon />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}