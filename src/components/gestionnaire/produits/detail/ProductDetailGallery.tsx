import Image from "next/image";

import {
  ImageOff,
  Images,
  Image as ImageIcon,
  Star,
} from "lucide-react";

import {
  getProductDetailPrimaryImage,
  sortProductDetailImages,
  type ProductDetail,
  type ProductDetailImage,
} from "@/lib/gestionnaire/produits/detail/product-detail-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — GALERIE DU DÉTAIL PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/detail/ProductDetailGallery.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher l'image principale ;
 * - afficher les images secondaires ;
 * - respecter l'ordre défini en base ;
 * - privilégier l'image marquée isPrimary ;
 * - utiliser product.primaryImage lorsque disponible ;
 * - éliminer les doublons accidentels ;
 * - gérer les URL absentes ou invalides ;
 * - fournir des textes alternatifs accessibles ;
 * - gérer zéro, une ou plusieurs images ;
 * - utiliser next/image ;
 * - rester indépendant de Prisma ;
 * - rester indépendant de la session Gestionnaire ;
 * - ne réaliser aucune mutation.
 *
 * IMPORTANT :
 *
 * Les images distantes utilisées avec next/image doivent être autorisées
 * dans next.config.ts / next.config.mjs via images.remotePatterns.
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

export interface ProductDetailGalleryProps {
  readonly product:
    ProductDetail;
}


interface MainProductImageProps {
  readonly image:
    ProductDetailImage;

  readonly productName:
    string;

  readonly imageCount:
    number;
}


interface ProductGalleryImageCardProps {
  readonly image:
    ProductDetailImage;

  readonly productName:
    string;

  readonly imageNumber:
    number;
}


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const FALLBACK_PRODUCT_NAME =
  "Produit";


const FALLBACK_ALT_TEXT =
  "Image du produit";


/* ==========================================================================
   NORMALISATION TEXTE
   ========================================================================== */

function normalizeText(
  value:
    string | null | undefined,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  return normalized ||
    null;
}


/* ==========================================================================
   URL IMAGE
   ========================================================================== */

/**
 * ProductDetail devrait déjà recevoir des URL propres depuis la couche
 * serveur.
 *
 * Cette fonction ajoute néanmoins une protection d'affichage afin qu'une
 * URL vide ou manifestement incorrecte ne casse pas toute la fiche produit.
 *
 * Les chemins absolus internes commençant par "/" restent autorisés.
 */

function isUsableProductImageUrl(
  value:
    unknown,
): value is string {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }


  const normalized =
    value.trim();


  if (
    !normalized ||
    normalized.length >
      2048
  ) {
    return false;
  }


  /* ------------------------------------------------------------------------
     IMAGE LOCALE
     ------------------------------------------------------------------------ */

  if (
    normalized.startsWith(
      "/",
    ) &&
    !normalized.startsWith(
      "//",
    )
  ) {
    return true;
  }


  /* ------------------------------------------------------------------------
     IMAGE DISTANTE
     ------------------------------------------------------------------------ */

  try {
    const url =
      new URL(
        normalized,
      );


    return (
      (
        url.protocol ===
          "https:" ||
        url.protocol ===
          "http:"
      ) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}


/* ==========================================================================
   IMAGE VALIDE
   ========================================================================== */

function isUsableProductImage(
  image:
    ProductDetailImage | null | undefined,
): image is ProductDetailImage {
  if (
    !image
  ) {
    return false;
  }


  if (
    typeof image.id !==
      "string" ||
    !image.id.trim()
  ) {
    return false;
  }


  return isUsableProductImageUrl(
    image.url,
  );
}


/* ==========================================================================
   DÉDOUBLONNAGE
   ========================================================================== */

/**
 * Déduplique par ID.
 *
 * On ne déduplique volontairement pas par URL car deux enregistrements
 * différents peuvent, dans certains cas, pointer vers le même visuel.
 */

function deduplicateProductImages(
  images:
    readonly ProductDetailImage[],
): ProductDetailImage[] {
  const seenIds =
    new Set<string>();


  const result:
    ProductDetailImage[] =
      [];


  for (
    const image
    of images
  ) {
    const id =
      image.id.trim();


    if (
      !id ||
      seenIds.has(
        id,
      )
    ) {
      continue;
    }


    seenIds.add(
      id,
    );


    result.push(
      image,
    );
  }


  return result;
}


/* ==========================================================================
   IMAGES ORDONNÉES
   ========================================================================== */

function getOrderedProductImages(
  product:
    ProductDetail,
): ProductDetailImage[] {
  const validImages =
    product.images.filter(
      isUsableProductImage,
    );


  const uniqueImages =
    deduplicateProductImages(
      validImages,
    );


  return sortProductDetailImages(
    uniqueImages,
  );
}


/* ==========================================================================
   IMAGE PRINCIPALE
   ========================================================================== */

/**
 * Priorités :
 *
 * 1. product.primaryImage si elle est valide ET appartient au tableau ;
 * 2. image isPrimary du tableau ;
 * 3. première image ordonnée ;
 * 4. null.
 *
 * On évite ainsi qu'une ancienne primaryImage détachée du tableau courant
 * soit affichée accidentellement.
 */

function resolvePrimaryImage(
  product:
    ProductDetail,

  orderedImages:
    readonly ProductDetailImage[],
): ProductDetailImage | null {
  if (
    isUsableProductImage(
      product.primaryImage,
    )
  ) {
    const matchingImage =
      orderedImages.find(
        (
          image,
        ) =>
          image.id ===
          product.primaryImage?.id,
      );


    if (
      matchingImage
    ) {
      return matchingImage;
    }
  }


  return getProductDetailPrimaryImage(
    orderedImages,
  );
}


/* ==========================================================================
   PRODUCT NAME
   ========================================================================== */

function getProductName(
  product:
    ProductDetail,
): string {
  return (
    normalizeText(
      product.name,
    ) ??
    FALLBACK_PRODUCT_NAME
  );
}


/* ==========================================================================
   ALT TEXT
   ========================================================================== */

function getImageAltText(
  image:
    ProductDetailImage,

  productName:
    string,

  imageNumber?:
    number,
): string {
  const explicitAlt =
    normalizeText(
      image.altText,
    );


  if (
    explicitAlt
  ) {
    return explicitAlt;
  }


  const normalizedProductName =
    normalizeText(
      productName,
    );


  if (
    normalizedProductName &&
    typeof imageNumber ===
      "number"
  ) {
    return `${normalizedProductName} — image ${imageNumber}`;
  }


  if (
    normalizedProductName
  ) {
    return `${normalizedProductName} — ${FALLBACK_ALT_TEXT}`;
  }


  return FALLBACK_ALT_TEXT;
}


/* ==========================================================================
   COMPTEUR
   ========================================================================== */

function getGalleryImageCountLabel(
  count:
    number,
): string {
  if (
    count <=
    0
  ) {
    return "Aucune image";
  }


  if (
    count ===
    1
  ) {
    return "1 image";
  }


  return `${count} images`;
}


/* ==========================================================================
   POSITION D'UNE IMAGE
   ========================================================================== */

/**
 * Retourne le vrai numéro visuel de l'image dans le tableau ordonné.
 */

function getImageNumber(
  images:
    readonly ProductDetailImage[],

  imageId:
    string,
): number {
  const index =
    images.findIndex(
      (
        image,
      ) =>
        image.id ===
        imageId,
    );


  return index >=
    0
    ? index + 1
    : 1;
}


/* ==========================================================================
   IMAGE PRINCIPALE
   ========================================================================== */

function MainProductImage({
  image,
  productName,
  imageCount,
}: MainProductImageProps) {
  const alt =
    getImageAltText(
      image,
      productName,
      1,
    );


  const caption =
    normalizeText(
      image.altText,
    );


  return (
    <figure className="productDetailGalleryMainFigure">
      <div className="productDetailGalleryMainMedia">
        <Image
          src={image.url}
          alt={alt}
          fill
          priority
          sizes="(max-width: 680px) calc(100vw - 52px), (max-width: 1020px) calc(100vw - 80px), (max-width: 1440px) 58vw, 820px"
          className="productDetailGalleryMainImage"
        />


        {/* =================================================================
            IMAGE PRINCIPALE
            ================================================================= */}

        <div
          className="productDetailGalleryPrimaryBadge"
          aria-label="Image principale du produit"
        >
          <Star
            size={13}
            strokeWidth={2}
            fill="currentColor"
            aria-hidden="true"
          />

          <span>
            Image principale
          </span>
        </div>


        {/* =================================================================
            COMPTEUR
            ================================================================= */}

        <div
          className="productDetailGalleryMediaCount"
          aria-label={getGalleryImageCountLabel(
            imageCount,
          )}
        >
          <Images
            size={14}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span>
            {imageCount}
          </span>
        </div>
      </div>


      {/* ===================================================================
          LÉGENDE
          =================================================================== */}

      {caption ? (
        <figcaption className="productDetailGalleryCaption">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}


/* ==========================================================================
   IMAGE SECONDAIRE
   ========================================================================== */

function ProductGalleryImageCard({
  image,
  productName,
  imageNumber,
}: ProductGalleryImageCardProps) {
  const alt =
    getImageAltText(
      image,
      productName,
      imageNumber,
    );


  const caption =
    normalizeText(
      image.altText,
    ) ??
    `Image ${imageNumber}`;


  return (
    <figure className="productDetailGalleryThumbnailFigure">
      <div className="productDetailGalleryThumbnailMedia">
        <Image
          src={image.url}
          alt={alt}
          fill
          loading="lazy"
          sizes="(max-width: 360px) calc(100vw - 54px), (max-width: 680px) 42vw, (max-width: 1020px) 29vw, 180px"
          className="productDetailGalleryThumbnailImage"
        />


        {/* =================================================================
            NUMÉRO
            ================================================================= */}

        <span
          className="productDetailGalleryThumbnailNumber"
          aria-hidden="true"
        >
          {imageNumber}
        </span>


        {/* =================================================================
            MARQUEUR PRINCIPAL DÉFENSIF
            =================================================================
            
            Normalement une image secondaire ne possède pas ce marqueur
            puisque la principale est filtrée avant ce rendu.
            
            On le conserve pour rendre le composant résistant à une donnée
            incohérente.
            ================================================================= */}

        {image.isPrimary ? (
          <span
            className="productDetailGalleryThumbnailPrimary"
            aria-label="Image marquée comme principale"
            title="Image principale"
          >
            <Star
              size={12}
              strokeWidth={2}
              fill="currentColor"
              aria-hidden="true"
            />
          </span>
        ) : null}
      </div>


      <figcaption
        className="productDetailGalleryThumbnailCaption"
        title={caption}
      >
        {caption}
      </figcaption>
    </figure>
  );
}


/* ==========================================================================
   ÉTAT VIDE
   ========================================================================== */

function ProductGalleryEmptyState({
  productName,
}: {
  readonly productName:
    string;
}) {
  return (
    <div
      className="productDetailGalleryEmpty"
      role="status"
      aria-live="polite"
    >
      <div
        className="productDetailGalleryEmptyIcon"
        aria-hidden="true"
      >
        <ImageOff
          size={40}
          strokeWidth={1.5}
        />
      </div>


      <div className="productDetailGalleryEmptyContent">
        <span className="productDetailGalleryEmptyEyebrow">
          Galerie vide
        </span>

        <h3 className="productDetailGalleryEmptyTitle">
          Aucune image disponible
        </h3>

        <p className="productDetailGalleryEmptyText">
          Aucune image valide n’est actuellement associée au produit{" "}
          <strong>
            {productName}
          </strong>
          .
        </p>
      </div>
    </div>
  );
}


/* ==========================================================================
   IMAGE UNIQUE
   ========================================================================== */

function ProductGallerySingleImageNotice() {
  return (
    <div
      className="productDetailGallerySingle"
      role="note"
    >
      <div
        className="productDetailGallerySingleIcon"
        aria-hidden="true"
      >
        <ImageIcon
          size={16}
          strokeWidth={1.9}
        />
      </div>

      <div className="productDetailGallerySingleContent">
        <strong className="productDetailGallerySingleTitle">
          Une seule image
        </strong>

        <p className="productDetailGallerySingleText">
          Ce produit possède actuellement une seule image enregistrée.
        </p>
      </div>
    </div>
  );
}


/* ==========================================================================
   COMPOSANT PRINCIPAL
   ========================================================================== */

export default function ProductDetailGallery({
  product,
}: ProductDetailGalleryProps) {
  /* =========================================================================
     PRODUIT
     ========================================================================= */

  const productName =
    getProductName(
      product,
    );


  /* =========================================================================
     IMAGES
     ========================================================================= */

  const images =
    getOrderedProductImages(
      product,
    );


  /* =========================================================================
     IMAGE PRINCIPALE
     ========================================================================= */

  const primaryImage =
    resolvePrimaryImage(
      product,
      images,
    );


  /* =========================================================================
     COMPTEUR
     ========================================================================= */

  const imageCount =
    images.length;


  const imageCountLabel =
    getGalleryImageCountLabel(
      imageCount,
    );


  /* =========================================================================
     IMAGES SECONDAIRES
     ========================================================================= */

  const secondaryImages =
    primaryImage
      ? images.filter(
          (
            image,
          ) =>
            image.id !==
            primaryImage.id,
        )
      : [];


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <section
      className="productDetailGallery"
      aria-labelledby="product-detail-gallery-title"
    >
      {/* ===================================================================
          HEADER
          =================================================================== */}

      <div className="productDetailGalleryHeader">
        <div className="productDetailGalleryHeaderMain">
          <div
            className="productDetailGalleryHeaderIcon"
            aria-hidden="true"
          >
            <ImageIcon
              size={20}
              strokeWidth={1.9}
            />
          </div>


          <div className="productDetailGalleryHeaderContent">
            <div className="productDetailGalleryTitleRow">
              <h2
                id="product-detail-gallery-title"
                className="productDetailGalleryTitle"
              >
                Galerie du produit
              </h2>
            </div>

            <p className="productDetailGallerySubtitle">
              Consultez les visuels enregistrés pour ce produit.
            </p>
          </div>
        </div>


        {/* =================================================================
            COMPTEUR GLOBAL
            ================================================================= */}

        <div
          className="productDetailGalleryCount"
          aria-label={imageCountLabel}
          title={imageCountLabel}
        >
          <Images
            size={15}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <strong>
            {imageCount}
          </strong>

          <span>
            {imageCount ===
            1
              ? "image"
              : "images"}
          </span>
        </div>
      </div>


      {/* ===================================================================
          CONTENU
          =================================================================== */}

      {primaryImage ? (
        <div className="productDetailGalleryContent">
          {/* =================================================================
              IMAGE PRINCIPALE
              ================================================================= */}

          <div className="productDetailGalleryMainColumn">
            <MainProductImage
              image={primaryImage}
              productName={productName}
              imageCount={imageCount}
            />
          </div>


          {/* =================================================================
              IMAGES SECONDAIRES
              ================================================================= */}

          {secondaryImages.length >
          0 ? (
            <aside
              className="productDetailGallerySecondary"
              aria-labelledby="product-detail-gallery-secondary-title"
            >
              <div className="productDetailGallerySecondaryHeader">
                <div className="productDetailGallerySecondaryHeading">
                  <span className="productDetailGallerySecondaryEyebrow">
                    Galerie
                  </span>

                  <h3
                    id="product-detail-gallery-secondary-title"
                    className="productDetailGallerySecondaryTitle"
                  >
                    Autres images
                  </h3>
                </div>


                <span
                  className="productDetailGallerySecondaryCount"
                  aria-label={`${secondaryImages.length} image${
                    secondaryImages.length >
                    1
                      ? "s"
                      : ""
                  } secondaire${
                    secondaryImages.length >
                    1
                      ? "s"
                      : ""
                  }`}
                >
                  {secondaryImages.length}
                </span>
              </div>


              <div className="productDetailGalleryGrid">
                {secondaryImages.map(
                  (
                    image,
                  ) => {
                    const imageNumber =
                      getImageNumber(
                        images,
                        image.id,
                      );


                    return (
                      <ProductGalleryImageCard
                        key={image.id}
                        image={image}
                        productName={productName}
                        imageNumber={imageNumber}
                      />
                    );
                  },
                )}
              </div>
            </aside>
          ) : (
            <ProductGallerySingleImageNotice />
          )}
        </div>
      ) : (
        <ProductGalleryEmptyState
          productName={productName}
        />
      )}
    </section>
  );
}