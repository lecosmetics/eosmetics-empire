import {
  Search,
} from "lucide-react";

import {
  PUBLIC_SEARCH_QUERY_PARAMETER,
  PUBLIC_SEARCH_ROUTE,
} from "@/config/public-navigation";

import styles from "./public-shell.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE PUBLIC — FORMULAIRE DE RECHERCHE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/PublicSearchForm.tsx
 *
 *
 * RESPONSABILITÉS :
 *
 * - fournir la recherche principale du site public ;
 * - être réutilisable dans le header desktop ;
 * - être réutilisable dans le header mobile ;
 * - utiliser une soumission GET native ;
 * - rendre la recherche utilisable même sans JavaScript côté client ;
 * - conserver le terme recherché lorsque nécessaire ;
 * - garantir des identifiants HTML distincts ;
 * - rester accessible au clavier et aux lecteurs d'écran ;
 * - ne contenir aucune donnée métier fictive ;
 * - ne contenir aucune logique Prisma ;
 * - ne contenir aucune session cliente ;
 * - ne contenir aucune logique panier ;
 * - ne contenir aucune logique de localisation.
 *
 *
 * ROUTE :
 *
 * PUBLIC_SEARCH_ROUTE
 *
 * actuellement :
 *
 * /recherche
 *
 *
 * PARAMÈTRE :
 *
 * PUBLIC_SEARCH_QUERY_PARAMETER
 *
 * actuellement :
 *
 * q
 *
 *
 * Exemple :
 *
 * /recherche?q=serum
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

/**
 * Limite raisonnable pour un terme de recherche public.
 *
 * Cette valeur protège l'interface contre les chaînes extrêmement longues.
 * La validation serveur de la future page /recherche devra rester
 * indépendante et refaire ses propres contrôles.
 */

const PUBLIC_SEARCH_MAX_LENGTH =
  160;


/* ==========================================================================
   TYPES
   ========================================================================== */

export type PublicSearchFormVariant =
  | "desktop"
  | "mobile";


export interface PublicSearchFormProps {
  /**
   * Identifiant HTML obligatoire.
   *
   * Le header desktop et le header mobile peuvent être présents
   * simultanément dans le DOM puis masqués avec CSS.
   *
   * Il faut donc leur fournir des IDs distincts.
   *
   * Exemple :
   *
   * public-search-desktop
   * public-search-mobile
   */
  readonly id:
    string;

  /**
   * Variante purement visuelle.
   *
   * Aucune différence de logique métier entre desktop et mobile.
   */
  readonly variant:
    PublicSearchFormVariant;

  /**
   * Valeur initiale facultative.
   *
   * Utile plus tard sur /recherche afin de conserver le terme saisi.
   */
  readonly defaultQuery?:
    string | null;

  /**
   * Texte visible dans le champ lorsqu'il est vide.
   */
  readonly placeholder?:
    string;

  /**
   * Label accessible du formulaire.
   */
  readonly ariaLabel?:
    string;

  /**
   * Classe supplémentaire facultative pour le conteneur.
   *
   * Elle permet au parent d'ajuster le placement sans modifier
   * la structure interne du formulaire.
   */
  readonly className?:
    string;
}


/* ==========================================================================
   NORMALISATION
   ========================================================================== */

function normalizeDefaultSearchQuery(
  value:
    string | null | undefined,
): string {
  if (
    typeof value !==
      "string"
  ) {
    return "";
  }


  return value
    .trim()
    .slice(
      0,
      PUBLIC_SEARCH_MAX_LENGTH,
    );
}


/* ==========================================================================
   CLASSES
   ========================================================================== */

function getPublicSearchFormClassName(
  variant:
    PublicSearchFormVariant,
  className:
    string | undefined,
): string {
  const variantClassName =
    variant ===
      "mobile"
      ? styles.publicSearchFormMobile
      : styles.publicSearchFormDesktop;


  return [
    styles.publicSearchForm,
    variantClassName,
    className,
  ]
    .filter(
      Boolean,
    )
    .join(
      " ",
    );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function PublicSearchForm({
  id,
  variant,
  defaultQuery =
    null,
  placeholder =
    "Rechercher un produit, une marque ou une catégorie",
  ariaLabel =
    "Rechercher dans Cosmetics Empire",
  className,
}: PublicSearchFormProps) {
  const inputId =
    `${id}-input`;


  const normalizedDefaultQuery =
    normalizeDefaultSearchQuery(
      defaultQuery,
    );


  return (
    <form
      action={PUBLIC_SEARCH_ROUTE}
      method="get"
      role="search"
      aria-label={ariaLabel}
      className={
        getPublicSearchFormClassName(
          variant,
          className,
        )
      }
    >
      {/* ====================================================================
          LABEL ACCESSIBLE
          ==================================================================== */}

      <label
        htmlFor={inputId}
        className={styles.publicSearchLabel}
      >
        Rechercher dans Cosmetics Empire
      </label>


      {/* ====================================================================
          SEARCH FIELD
          ==================================================================== */}

      <div className={styles.publicSearchField}>
        <Search
          className={styles.publicSearchLeadingIcon}
          size={20}
          strokeWidth={1.8}
          aria-hidden="true"
        />

        <input
          id={inputId}
          name={PUBLIC_SEARCH_QUERY_PARAMETER}
          type="search"
          defaultValue={normalizedDefaultQuery}
          placeholder={placeholder}
          maxLength={PUBLIC_SEARCH_MAX_LENGTH}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          inputMode="search"
          className={styles.publicSearchInput}
          aria-label="Produit, marque ou catégorie"
        />


        {/* ==================================================================
            SUBMIT
            ================================================================== */}

        <button
          type="submit"
          className={styles.publicSearchSubmit}
          aria-label="Lancer la recherche"
          title="Rechercher"
        >
          <Search
            size={20}
            strokeWidth={2}
            aria-hidden="true"
          />

          <span className={styles.publicSearchSubmitText}>
            Rechercher
          </span>
        </button>
      </div>
    </form>
  );
}