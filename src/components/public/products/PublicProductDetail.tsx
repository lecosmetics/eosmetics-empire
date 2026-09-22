"use client";

import {
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  BadgePercent,
  Check,
  ChevronRight,
  CircleAlert,
  Globe2,
  ImageOff,
  Info,
  MapPin,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBag,
  Store,
  Tag,
  Truck,
} from "lucide-react";

import PublicAddToPanierButton from "@/components/public/panier/PublicAddToPanierButton";

import {
  PUBLIC_NAVIGATION_ROUTES,
} from "@/config/public-navigation";

import {
  generalAppRoutes,
} from "@/config/routes";

import {
  PUBLIC_SITE,
} from "@/config/public-site";

import type {
  PublicProductDetailImage,
  PublicProductDetailProps,
} from "@/lib/public/products/public-product-detail-types";

import styles from "./public-product-detail.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * FICHE PRODUIT PUBLIQUE — VERSION PREMIUM
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/products/PublicProductDetail.tsx
 *
 * Route :
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher la fiche commerciale premium complète d'UNE offre StoreProduct.
 *
 * ============================================================================
 *
 * ARCHITECTURE MÉTIER :
 *
 * Product
 *    ↓
 * StoreProduct
 *    ↓
 * Store
 *
 * ============================================================================
 *
 * UNE FICHE =
 *
 * UNE offre StoreProduct précise.
 *
 * ============================================================================
 *
 * PRODUCT :
 *
 * - nom ;
 * - marque ;
 * - SKU ;
 * - catégorie ;
 * - description ;
 * - ingrédients ;
 * - conseils d'utilisation ;
 * - contenance ;
 * - unité ;
 * - images.
 *
 * ============================================================================
 *
 * STOREPRODUCT :
 *
 * - prix ;
 * - ancien prix ;
 * - économie ;
 * - devise ;
 * - stock ;
 * - disponibilité ;
 * - qrToken.
 *
 * ============================================================================
 *
 * STORE :
 *
 * - boutique ;
 * - ville ;
 * - pays.
 *
 * ============================================================================
 *
 * PANIER :
 *
 * La fiche utilise le vrai :
 *
 * PublicAddToPanierButton
 *
 * ============================================================================
 *
 * Le navigateur ne devient jamais source de vérité pour :
 *
 * - prix ;
 * - devise ;
 * - stock ;
 * - disponibilité ;
 * - boutique.
 *
 * ============================================================================
 *
 * LIVRAISON :
 *
 * La page informe clairement :
 *
 * - livraison en Afrique ;
 * - livraison internationale ;
 * - frais et délais selon destination.
 *
 * Aucun :
 *
 * - tarif fictif ;
 * - délai fictif ;
 * - transporteur fictif ;
 * - livraison gratuite fictive
 *
 * n'est affiché.
 *
 * ============================================================================
 *
 * DESKTOP :
 *
 * Footer public conservé.
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * Footer public MASQUÉ pour cette route.
 *
 * Navigation fixe conservée :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * ============================================================================
 */


/* ==========================================================================
   1. HELPERS — CLASSES
   ========================================================================== */

function joinClassNames(
  ...classNames:
    Array<
      string |
      null |
      undefined |
      false
    >
): string {
  return classNames
    .filter(
      (
        className,
      ): className is string =>
        typeof className ===
          "string" &&
        className.length >
          0,
    )
    .join(
      " ",
    );
}


/* ==========================================================================
   2. FORMATAGE MONÉTAIRE
   ========================================================================== */

function formatNumericAmount(
  amount:
    number,
): string {
  return new Intl.NumberFormat(
    "fr-FR",
    {
      minimumFractionDigits:
        Number.isInteger(
          amount,
        )
          ? 0
          : 2,

      maximumFractionDigits:
        2,
    },
  ).format(
    amount,
  );
}


function formatMoney(
  amount:
    string,

  currency:
    string,
): string {
  const normalizedAmount =
    amount.trim();


  const normalizedCurrency =
    currency
      .trim()
      .toUpperCase();


  const numericAmount =
    Number(
      normalizedAmount,
    );


  if (
    !Number.isFinite(
      numericAmount,
    )
  ) {
    return [
      normalizedAmount,
      normalizedCurrency,
    ]
      .filter(
        Boolean,
      )
      .join(
        " ",
      );
  }


  const formattedAmount =
    formatNumericAmount(
      numericAmount,
    );


  /**
   * XAF et XOF restent leurs vraies devises dans les données.
   *
   * Leur présentation commerciale commune est :
   *
   * FCFA
   */
  if (
    normalizedCurrency ===
      "XAF" ||
    normalizedCurrency ===
      "XOF"
  ) {
    return `${formattedAmount} FCFA`;
  }


  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style:
          "currency",

        currency:
          normalizedCurrency,

        currencyDisplay:
          "code",

        minimumFractionDigits:
          Number.isInteger(
            numericAmount,
          )
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      },
    ).format(
      numericAmount,
    );
  } catch {
    return `${formattedAmount} ${normalizedCurrency}`;
  }
}


/* ==========================================================================
   3. DISPONIBILITÉ
   ========================================================================== */

function getAvailabilityLabel(
  availability:
    PublicProductDetailProps[
      "product"
    ][
      "inventory"
    ][
      "availability"
    ],
): string {
  switch (
    availability
  ) {
    case "IN_STOCK":
      return "Disponible";


    case "LOW_STOCK":
      return "Stock limité";


    case "OUT_OF_STOCK":
      return "Rupture de stock";


    default:
      return "Indisponible";
  }
}


/* ==========================================================================
   4. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicProductDetail({
  product,
}: PublicProductDetailProps) {
  /* =========================================================================
     IMAGE INITIALE
     ========================================================================= */

  const initialImage =
    product.primaryImage ??
    product.images[0] ??
    null;


  const [
    selectedImageId,
    setSelectedImageId,
  ] =
    useState<
      string |
      null
    >(
      initialImage?.id ??
      null,
    );


  /* =========================================================================
     QUANTITÉ
     ========================================================================= */

  const maximumQuantity =
    Math.max(
      0,
      product.panier
        .maximumQuantity,
    );


  const [
    selectedQuantity,
    setSelectedQuantity,
  ] =
    useState(
      Math.max(
        1,
        product.panier
          .defaultQuantity,
      ),
    );


  /**
   * Protection en cas de changement des données disponible/stock.
   *
   * Aucun setState dans useEffect n'est nécessaire.
   */
  const effectiveQuantity =
    maximumQuantity >
      0
      ? Math.min(
          Math.max(
            1,
            selectedQuantity,
          ),
          maximumQuantity,
        )
      : 1;


  /* =========================================================================
     IMAGE SÉLECTIONNÉE
     ========================================================================= */

  const selectedImage =
    useMemo<
      PublicProductDetailImage |
      null
    >(
      () => {
        if (
          product.images.length ===
          0
        ) {
          return null;
        }


        if (
          selectedImageId
        ) {
          const match =
            product.images.find(
              (
                image,
              ) =>
                image.id ===
                selectedImageId,
            );


          if (
            match
          ) {
            return match;
          }
        }


        return (
          product.primaryImage ??
          product.images[0] ??
          null
        );
      },

      [
        product.images,
        product.primaryImage,
        selectedImageId,
      ],
    );


  /* =========================================================================
     PRIX
     ========================================================================= */

  const formattedPrice =
    formatMoney(
      product.pricing.amount,
      product.pricing.currency,
    );


  const formattedCompareAtPrice =
    product.pricing
      .compareAtAmount
      ? formatMoney(
          product.pricing
            .compareAtAmount,
          product.pricing
            .currency,
        )
      : null;


  const formattedSavings =
    product.pricing
      .savingsAmount
      ? formatMoney(
          product.pricing
            .savingsAmount,
          product.pricing
            .currency,
        )
      : null;


  /* =========================================================================
     DISPONIBILITÉ
     ========================================================================= */

  const availabilityLabel =
    getAvailabilityLabel(
      product.inventory
        .availability,
    );


  const isAvailable =
    product.inventory
      .isAvailable &&
    product.panier
      .canAddToPanier &&
    product.inventory
      .status ===
      "ACTIVE" &&
    maximumQuantity >
      0;


  const isLowStock =
    product.inventory
      .isLowStock;


  /* =========================================================================
     INFORMATIONS OPTIONNELLES
     ========================================================================= */

  const hasTechnicalInformation =
    Boolean(
      product.content
        .weightContent ||
      product.content
        .unit,
    );


  const hasDetailedInformation =
    Boolean(
      product.content
        .description ||
      product.content
        .ingredients ||
      product.content
        .usageInstructions ||
      hasTechnicalInformation,
    );


  /* =========================================================================
     QUANTITÉ — ACTIONS
     ========================================================================= */

  function decreaseQuantity():
    void {
    setSelectedQuantity(
      (
        current,
      ) =>
        Math.max(
          1,
          current -
            1,
        ),
    );
  }


  function increaseQuantity():
    void {
    if (
      maximumQuantity <=
      0
    ) {
      return;
    }


    setSelectedQuantity(
      (
        current,
      ) =>
        Math.min(
          maximumQuantity,
          current +
            1,
        ),
    );
  }


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <article
      className={
        styles.productDetailPage
      }
      data-public-product-detail="true"
      data-public-product-detail-route="true"
      data-store-product-id={
        product.offer
          .storeProductId
      }
      data-product-id={
        product.offer
          .productId
      }
      data-product-availability={
        product.inventory
          .availability
      }
      data-product-status={
        product.inventory
          .status
      }
    >
      {/* ==================================================================
          BREADCRUMB
          ================================================================== */}

      <nav
        className={
          styles.productDetailBreadcrumb
        }
        aria-label="Fil d’Ariane"
      >
        <ol
          className={
            styles.productDetailBreadcrumbList
          }
        >
          <li>
            <Link
              href={
                PUBLIC_NAVIGATION_ROUTES.HOME
              }
              className={
                styles.productDetailBreadcrumbLink
              }
            >
              Accueil
            </Link>
          </li>


          <li
            className={
              styles.productDetailBreadcrumbSeparator
            }
            aria-hidden="true"
          >
            <ChevronRight
              size={14}
              strokeWidth={1.8}
            />
          </li>


          <li>
            <Link
              href={
                PUBLIC_NAVIGATION_ROUTES.PRODUCTS
              }
              className={
                styles.productDetailBreadcrumbLink
              }
            >
              Produits
            </Link>
          </li>


          {product.category ? (
            <>
              <li
                className={
                  styles.productDetailBreadcrumbSeparator
                }
                aria-hidden="true"
              >
                <ChevronRight
                  size={14}
                  strokeWidth={1.8}
                />
              </li>


              <li>
                <Link
                  href={
                    product.category
                      .href
                  }
                  className={
                    styles.productDetailBreadcrumbLink
                  }
                >
                  {
                    product.category
                      .name
                  }
                </Link>
              </li>
            </>
          ) : null}


          <li
            className={
              styles.productDetailBreadcrumbSeparator
            }
            aria-hidden="true"
          >
            <ChevronRight
              size={14}
              strokeWidth={1.8}
            />
          </li>


          <li
            className={
              styles.productDetailBreadcrumbCurrent
            }
            aria-current="page"
          >
            {
              product.product
                .name
            }
          </li>
        </ol>
      </nav>


      {/* ==================================================================
          SECTION PRINCIPALE
          ================================================================== */}

      <div
        className={
          styles.productDetailMain
        }
      >
        {/* ================================================================
            GALERIE
            ================================================================ */}

        <section
          className={
            styles.productDetailGallery
          }
          aria-label={`Galerie de ${product.product.name}`}
        >
          <div
            className={
              styles.productDetailMainImageWrapper
            }
          >
            {selectedImage ? (
              <Image
                src={
                  selectedImage.url
                }
                alt={
                  selectedImage.altText
                }
                fill
                priority
                sizes="
                  (max-width: 767px) 100vw,
                  (max-width: 1199px) 52vw,
                  48vw
                "
                className={
                  styles.productDetailMainImage
                }
              />
            ) : (
              <div
                className={
                  styles.productDetailNoImage
                }
                role="img"
                aria-label={`Aucune image disponible pour ${product.product.name}`}
              >
                <ImageOff
                  size={40}
                  strokeWidth={1.4}
                  aria-hidden="true"
                />

                <span>
                  Aucune image disponible
                </span>
              </div>
            )}


            {product.pricing
              .hasDiscount ? (
              <span
                className={
                  styles.productDetailPromotionBadge
                }
              >
                <BadgePercent
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                {product.pricing
                  .discountPercentage !==
                null ? (
                  <>
                    -
                    {
                      product.pricing
                        .discountPercentage
                    }
                    %
                  </>
                ) : (
                  <>Promotion</>
                )}
              </span>
            ) : null}
          </div>


          {/* ==============================================================
              MINIATURES
              ============================================================== */}

          {product.images.length >
          1 ? (
            <div
              className={
                styles.productDetailThumbnails
              }
              role="group"
              aria-label="Galerie du produit"
            >
              {product.images.map(
                (
                  image,
                  index,
                ) => {
                  const selected =
                    selectedImage?.id ===
                    image.id;


                  return (
                    <button
                      key={
                        image.id
                      }
                      type="button"
                      className={
                        joinClassNames(
                          styles.productDetailThumbnailButton,
                          selected &&
                            styles.productDetailThumbnailButtonActive,
                        )
                      }
                      onClick={
                        () =>
                          setSelectedImageId(
                            image.id,
                          )
                      }
                      aria-label={`Afficher l’image ${index + 1} de ${product.product.name}`}
                      aria-pressed={
                        selected
                      }
                    >
                      <span
                        className={
                          styles.productDetailThumbnailMedia
                        }
                      >
                        <Image
                          src={
                            image.url
                          }
                          alt=""
                          fill
                          sizes="96px"
                          className={
                            styles.productDetailThumbnailImage
                          }
                        />
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          ) : null}
        </section>


        {/* ================================================================
            PANNEAU COMMERCIAL
            ================================================================ */}

        <section
          className={
            styles.productDetailCommercial
          }
          aria-labelledby="public-product-detail-title"
        >
          {/* ==============================================================
              MARQUE
              ============================================================== */}

          <p
            className={
              styles.productDetailBrand
            }
          >
            {
              product.product
                .brand
            }
          </p>


          {/* ==============================================================
              TITRE
              ============================================================== */}

          <h1
            id="public-product-detail-title"
            className={
              styles.productDetailTitle
            }
          >
            {
              product.product
                .name
            }
          </h1>


          {/* ==============================================================
              MÉTADONNÉES
              ============================================================== */}

          <div
            className={
              styles.productDetailMeta
            }
          >
            <span
              className={
                styles.productDetailSku
              }
            >
              Réf.{" "}
              <strong>
                {
                  product.product
                    .sku
                }
              </strong>
            </span>


            {product.category ? (
              <Link
                href={
                  product.category
                    .href
                }
                className={
                  styles.productDetailCategoryLink
                }
              >
                <Tag
                  size={14}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                {
                  product.category
                    .name
                }
              </Link>
            ) : null}
          </div>


          {/* ==============================================================
              PRIX
              ============================================================== */}

          <div
            className={
              styles.productDetailPricing
            }
          >
            <div
              className={
                styles.productDetailPriceRow
              }
            >
              <strong
                className={
                  styles.productDetailCurrentPrice
                }
              >
                {
                  formattedPrice
                }
              </strong>


              {formattedCompareAtPrice ? (
                <span
                  className={
                    styles.productDetailComparePrice
                  }
                >
                  {
                    formattedCompareAtPrice
                  }
                </span>
              ) : null}
            </div>


            {product.pricing
              .hasDiscount &&
            formattedSavings ? (
              <div
                className={
                  styles.productDetailSavingsRow
                }
              >
                <BadgePercent
                  size={15}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  Économie :{" "}
                  <strong>
                    {
                      formattedSavings
                    }
                  </strong>
                </span>
              </div>
            ) : null}
          </div>


          {/* ==============================================================
              DISPONIBILITÉ
              ============================================================== */}

          <div
            className={
              joinClassNames(
                styles.productDetailAvailability,
                isAvailable &&
                  !isLowStock &&
                  styles.productDetailAvailabilityInStock,
                isLowStock &&
                  styles.productDetailAvailabilityLowStock,
                !isAvailable &&
                  styles.productDetailAvailabilityOutOfStock,
              )
            }
          >
            <span
              className={
                styles.productDetailAvailabilityIcon
              }
              aria-hidden="true"
            >
              {isAvailable &&
              !isLowStock ? (
                <PackageCheck
                  size={21}
                  strokeWidth={1.8}
                />
              ) : (
                <CircleAlert
                  size={21}
                  strokeWidth={1.8}
                />
              )}
            </span>


            <div
              className={
                styles.productDetailAvailabilityContent
              }
            >
              <strong>
                {
                  availabilityLabel
                }
              </strong>


              {isAvailable ? (
                <span>
                  {
                    product.inventory
                      .stockQuantity
                  }{" "}
                  unité
                  {
                    product.inventory
                      .stockQuantity >
                    1
                      ? "s"
                      : ""
                  }{" "}
                  disponible
                  {
                    product.inventory
                      .stockQuantity >
                    1
                      ? "s"
                      : ""
                  }
                </span>
              ) : (
                <span>
                  Cette offre reste consultable mais ne peut pas être
                  ajoutée au panier actuellement.
                </span>
              )}
            </div>
          </div>


          {/* ==============================================================
              BLOC ACHAT
              ============================================================== */}

          <div
            className={
              styles.productDetailPurchaseCard
            }
          >
            <div
              className={
                styles.productDetailPurchaseHeader
              }
            >
              <div>
                <p
                  className={
                    styles.productDetailPurchaseEyebrow
                  }
                >
                  Commander ce produit
                </p>

                <h2
                  className={
                    styles.productDetailPurchaseTitle
                  }
                >
                  Ajouter au panier
                </h2>
              </div>


              {isAvailable ? (
                <span
                  className={
                    styles.productDetailPurchaseStatus
                  }
                >
                  <Check
                    size={15}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  Disponible
                </span>
              ) : null}
            </div>


            {/* ============================================================
                QUANTITÉ
                ============================================================ */}

            {isAvailable ? (
              <div
                className={
                  styles.productDetailQuantityArea
                }
              >
                <span
                  className={
                    styles.productDetailQuantityLabel
                  }
                >
                  Quantité
                </span>


                <div
                  className={
                    styles.productDetailQuantityControl
                  }
                  role="group"
                  aria-label="Quantité à ajouter au panier"
                >
                  <button
                    type="button"
                    className={
                      styles.productDetailQuantityButton
                    }
                    onClick={
                      decreaseQuantity
                    }
                    disabled={
                      effectiveQuantity <=
                      1
                    }
                    aria-label="Diminuer la quantité"
                  >
                    <Minus
                      size={17}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </button>


                  <output
                    className={
                      styles.productDetailQuantityValue
                    }
                    aria-live="polite"
                  >
                    {
                      effectiveQuantity
                    }
                  </output>


                  <button
                    type="button"
                    className={
                      styles.productDetailQuantityButton
                    }
                    onClick={
                      increaseQuantity
                    }
                    disabled={
                      effectiveQuantity >=
                      maximumQuantity
                    }
                    aria-label="Augmenter la quantité"
                  >
                    <Plus
                      size={17}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            ) : null}


            {/* ============================================================
                VRAI BOUTON PANIER
                ============================================================ */}

            <PublicAddToPanierButton
              storeProductId={
                product.offer
                  .storeProductId
              }
              quantity={
                effectiveQuantity
              }
              disabled={
                !isAvailable
              }
              label={
                isAvailable
                  ? "Ajouter au panier"
                  : "Produit indisponible"
              }
              className={
                styles.productDetailAddToPanierButton
              }
            />


            {/* ============================================================
                REDIRECTIONS
                ============================================================ */}

            <div
              className={
                styles.productDetailPurchaseActions
              }
            >
              <Link
                href={
                  PUBLIC_NAVIGATION_ROUTES.CART
                }
                className={
                  styles.productDetailPanierLink
                }
              >
                <ShoppingBag
                  size={17}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  Voir mon panier
                </span>
              </Link>


              <Link
                href={
                  generalAppRoutes.checkout
                }
                className={
                  styles.productDetailContinueLink
                }
              >
                <ArrowLeft
                  size={17}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  Passer la commande
                </span>
              </Link>
            </div>


            {product.category ? (
              <Link
                href={
                  product.category
                    .href
                }
                className={
                  styles.productDetailCategoryAction
                }
              >
                Voir les autres produits de{" "}
                {
                  product.category
                    .name
                }

                <ChevronRight
                  size={16}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
              </Link>
            ) : null}
          </div>


          {/* ==============================================================
              BOUTIQUE
              ============================================================== */}

          <section
            className={
              styles.productDetailStoreCard
            }
            aria-labelledby="public-product-store-title"
          >
            <div
              className={
                styles.productDetailStoreIcon
              }
              aria-hidden="true"
            >
              <Store
                size={23}
                strokeWidth={1.8}
              />
            </div>


            <div
              className={
                styles.productDetailStoreContent
              }
            >
              <span
                className={
                  styles.productDetailStoreEyebrow
                }
              >
                Point de vente de cette offre
              </span>


              <h2
                id="public-product-store-title"
                className={
                  styles.productDetailStoreName
                }
              >
                {
                  product.store
                    .name
                }
              </h2>


              <p
                className={
                  styles.productDetailStoreLocation
                }
              >
                <MapPin
                  size={15}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <span>
                  {
                    product.store
                      .city
                  }
                  ,{" "}
                  {
                    product.store
                      .country
                  }
                </span>
              </p>
            </div>
          </section>


          {/* ==============================================================
              SERVICES RAPIDES
              ============================================================== */}

          <div
            className={
              styles.productDetailQuickServices
            }
          >
            <a
              href="#livraison"
              className={
                styles.productDetailQuickService
              }
            >
              <Truck
                size={20}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <span>
                <strong>
                  Livraison
                </strong>

                <small>
                  Afrique & international
                </small>
              </span>
            </a>


            <a
              href={
                PUBLIC_SITE
                  .contact
                  .whatsapp
                  .href
              }
              target="_blank"
              rel="noopener noreferrer"
              className={
                styles.productDetailQuickService
              }
            >
              <MessageCircle
                size={20}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <span>
                <strong>
                  Besoin d&apos;aide ?
                </strong>

                <small>
                  Nous contacter sur WhatsApp
                </small>
              </span>
            </a>
          </div>
        </section>
      </div>


      {/* ==================================================================
          BARRE DE RÉASSURANCE SOBRE
          ================================================================== */}

      <section
        className={
          styles.productDetailServiceStrip
        }
        aria-label="Services disponibles"
      >
        <div
          className={
            styles.productDetailServiceItem
          }
        >
          <Truck
            size={22}
            strokeWidth={1.7}
            aria-hidden="true"
          />

          <div>
            <strong>
              Livraison en Afrique
            </strong>

            <span>
              Expédition vers les destinations desservies sur le continent.
            </span>
          </div>
        </div>


        <div
          className={
            styles.productDetailServiceItem
          }
        >
          <Globe2
            size={22}
            strokeWidth={1.7}
            aria-hidden="true"
          />

          <div>
            <strong>
              Livraison internationale
            </strong>

            <span>
              Expédition également vers les destinations desservies
              dans le monde.
            </span>
          </div>
        </div>


        <div
          className={
            styles.productDetailServiceItem
          }
        >
          <MessageCircle
            size={22}
            strokeWidth={1.7}
            aria-hidden="true"
          />

          <div>
            <strong>
              Assistance WhatsApp
            </strong>

            <span>
              Contactez directement L&amp;E pour une question sur votre
              commande ou la livraison.
            </span>
          </div>
        </div>
      </section>


      {/* ==================================================================
          INFORMATIONS PRODUIT
          ================================================================== */}

      {hasDetailedInformation ? (
        <section
          className={
            styles.productDetailInformation
          }
          aria-labelledby="public-product-information-title"
        >
          <header
            className={
              styles.productDetailInformationHeader
            }
          >
            <p
              className={
                styles.productDetailInformationEyebrow
              }
            >
              Informations produit
            </p>


            <h2
              id="public-product-information-title"
              className={
                styles.productDetailInformationTitle
              }
            >
              Tout savoir sur{" "}
              {
                product.product
                  .name
              }
            </h2>


            <p
              className={
                styles.productDetailInformationIntro
              }
            >
              Retrouvez ci-dessous les informations réellement renseignées
              pour ce produit.
            </p>
          </header>


          <div
            className={
              styles.productDetailInformationGrid
            }
          >
            {/* ============================================================
                DESCRIPTION
                ============================================================ */}

            {product.content
              .description ? (
              <section
                className={
                  joinClassNames(
                    styles.productDetailInformationBlock,
                    styles.productDetailInformationBlockWide,
                  )
                }
              >
                <div
                  className={
                    styles.productDetailInformationBlockIcon
                  }
                  aria-hidden="true"
                >
                  <Info
                    size={20}
                    strokeWidth={1.8}
                  />
                </div>


                <div>
                  <h3
                    className={
                      styles.productDetailInformationBlockTitle
                    }
                  >
                    Description
                  </h3>


                  <p
                    className={
                      styles.productDetailInformationText
                    }
                  >
                    {
                      product.content
                        .description
                    }
                  </p>
                </div>
              </section>
            ) : null}


            {/* ============================================================
                CONTENANCE / UNITÉ
                ============================================================ */}

            {hasTechnicalInformation ? (
              <section
                className={
                  styles.productDetailInformationBlock
                }
              >
                <h3
                  className={
                    styles.productDetailInformationBlockTitle
                  }
                >
                  Informations pratiques
                </h3>


                <dl
                  className={
                    styles.productDetailSpecifications
                  }
                >
                  {product.content
                    .weightContent ? (
                    <div
                      className={
                        styles.productDetailSpecification
                      }
                    >
                      <dt>
                        Contenance / poids
                      </dt>

                      <dd>
                        {
                          product.content
                            .weightContent
                        }
                      </dd>
                    </div>
                  ) : null}


                  {product.content
                    .unit ? (
                    <div
                      className={
                        styles.productDetailSpecification
                      }
                    >
                      <dt>
                        Unité
                      </dt>

                      <dd>
                        {
                          product.content
                            .unit
                        }
                      </dd>
                    </div>
                  ) : null}


                  <div
                    className={
                      styles.productDetailSpecification
                    }
                  >
                    <dt>
                      Référence
                    </dt>

                    <dd>
                      {
                        product.product
                          .sku
                      }
                    </dd>
                  </div>


                  {product.category ? (
                    <div
                      className={
                        styles.productDetailSpecification
                      }
                    >
                      <dt>
                        Catégorie
                      </dt>

                      <dd>
                        <Link
                          href={
                            product.category
                              .href
                          }
                        >
                          {
                            product.category
                              .name
                          }
                        </Link>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </section>
            ) : null}


            {/* ============================================================
                CONSEILS D'UTILISATION
                ============================================================ */}

            {product.content
              .usageInstructions ? (
              <section
                className={
                  styles.productDetailInformationBlock
                }
              >
                <h3
                  className={
                    styles.productDetailInformationBlockTitle
                  }
                >
                  Conseils d&apos;utilisation
                </h3>


                <p
                  className={
                    styles.productDetailInformationText
                  }
                >
                  {
                    product.content
                      .usageInstructions
                  }
                </p>
              </section>
            ) : null}


            {/* ============================================================
                INGRÉDIENTS
                ============================================================ */}

            {product.content
              .ingredients ? (
              <section
                className={
                  styles.productDetailInformationBlock
                }
              >
                <h3
                  className={
                    styles.productDetailInformationBlockTitle
                  }
                >
                  Ingrédients
                </h3>


                <p
                  className={
                    styles.productDetailInformationText
                  }
                >
                  {
                    product.content
                      .ingredients
                  }
                </p>
              </section>
            ) : null}
          </div>
        </section>
      ) : null}


      {/* ==================================================================
          LIVRAISON
          ================================================================== */}

      <section
        id="livraison"
        className={
          styles.productDetailDelivery
        }
        aria-labelledby="public-product-delivery-title"
      >
        <div
          className={
            styles.productDetailDeliveryIntro
          }
        >
          <p
            className={
              styles.productDetailDeliveryEyebrow
            }
          >
            Expédition L&amp;E Cosmetics Empire
          </p>


          <h2
            id="public-product-delivery-title"
            className={
              styles.productDetailDeliveryTitle
            }
          >
            Livraison en Afrique et dans le monde
          </h2>


          <p
            className={
              styles.productDetailDeliveryDescription
            }
          >
            L&amp;E Cosmetics Empire propose l&apos;expédition de ses
            produits en Afrique ainsi qu&apos;à l&apos;international.
            Les modalités, frais et délais applicables dépendent de la
            destination de livraison.
          </p>
        </div>


        <div
          className={
            styles.productDetailDeliveryGrid
          }
        >
          <article
            className={
              styles.productDetailDeliveryCard
            }
          >
            <span
              className={
                styles.productDetailDeliveryCardIcon
              }
              aria-hidden="true"
            >
              <Truck
                size={27}
                strokeWidth={1.7}
              />
            </span>


            <h3>
              Livraison partout en Afrique
            </h3>


            <p>
              Faites livrer votre commande dans les destinations africaines
              prises en charge par le service de livraison.
            </p>
          </article>


          <article
            className={
              styles.productDetailDeliveryCard
            }
          >
            <span
              className={
                styles.productDetailDeliveryCardIcon
              }
              aria-hidden="true"
            >
              <Globe2
                size={27}
                strokeWidth={1.7}
              />
            </span>


            <h3>
              Livraison internationale
            </h3>


            <p>
              Les commandes peuvent également être expédiées vers les
              destinations internationales prises en charge.
            </p>
          </article>


          <article
            className={
              styles.productDetailDeliveryCard
            }
          >
            <span
              className={
                styles.productDetailDeliveryCardIcon
              }
              aria-hidden="true"
            >
              <MessageCircle
                size={27}
                strokeWidth={1.7}
              />
            </span>


            <h3>
              Vérifier votre destination
            </h3>


            <p>
              Contactez L&amp;E sur WhatsApp pour obtenir les informations
              applicables à votre destination avant ou après votre commande.
            </p>


            <a
              href={
                PUBLIC_SITE
                  .contact
                  .whatsapp
                  .href
              }
              target="_blank"
              rel="noopener noreferrer"
              className={
                styles.productDetailDeliveryWhatsapp
              }
            >
              <MessageCircle
                size={17}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              WhatsApp
            </a>
          </article>
        </div>
      </section>


      {/* ==================================================================
          CTA FINAL
          ================================================================== */}

      <section
        className={
          styles.productDetailFinalCta
        }
        aria-labelledby="public-product-final-cta-title"
      >
        <div
          className={
            styles.productDetailFinalCtaContent
          }
        >
          <p
            className={
              styles.productDetailFinalCtaEyebrow
            }
          >
            L&amp;E Cosmetics Empire
          </p>


          <h2
            id="public-product-final-cta-title"
            className={
              styles.productDetailFinalCtaTitle
            }
          >
            Vous souhaitez découvrir d&apos;autres produits ?
          </h2>


          <p
            className={
              styles.productDetailFinalCtaText
            }
          >
            Parcourez le catalogue ou contactez notre équipe pour une
            question concernant ce produit ou sa livraison.
          </p>
        </div>


        <div
          className={
            styles.productDetailFinalCtaActions
          }
        >
          <Link
            href={
              PUBLIC_NAVIGATION_ROUTES.PRODUCTS
            }
            className={
              styles.productDetailFinalPrimaryAction
            }
          >
            Voir tous les produits

            <ChevronRight
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          </Link>


          <a
            href={
              PUBLIC_SITE
                .contact
                .whatsapp
                .href
            }
            target="_blank"
            rel="noopener noreferrer"
            className={
              styles.productDetailFinalSecondaryAction
            }
          >
            <MessageCircle
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            WhatsApp
          </a>
        </div>
      </section>
    </article>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * FICHE PRODUIT PREMIUM :
 *
 * GALERIE
 *
 *        ↓
 *
 * MARQUE
 * NOM
 * CATÉGORIE
 * RÉFÉRENCE
 *
 *        ↓
 *
 * PRIX
 * ANCIEN PRIX RÉEL
 * ÉCONOMIE RÉELLE
 *
 *        ↓
 *
 * STOCK
 * DISPONIBILITÉ
 *
 *        ↓
 *
 * QUANTITÉ
 *
 *        ↓
 *
 * AJOUTER AU PANIER
 *
 *        ↓
 *
 * VOIR MON PANIER
 * Passer la commande
 *
 *        ↓
 *
 * POINT DE VENTE
 *
 *        ↓
 *
 * LIVRAISON AFRIQUE
 * LIVRAISON INTERNATIONALE
 * WHATSAPP
 *
 *        ↓
 *
 * DESCRIPTION
 * INFORMATIONS
 * CONSEILS
 * INGRÉDIENTS
 *
 *        ↓
 *
 * CTA FINAL
 *
 * ============================================================================
 *
 * DESKTOP :
 *
 * Footer conservé.
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * Footer MASQUÉ.
 *
 * La barre basse reste :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * ============================================================================
 */