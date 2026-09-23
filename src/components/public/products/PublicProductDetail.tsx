"use client";

import {
  useMemo,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
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
 * FICHE PRODUIT PUBLIQUE — VERSION PREMIUM FINALE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/products/PublicProductDetail.tsx
 *
 * OBJECTIFS :
 *
 * - conserver toutes les données métier réelles ;
 * - conserver le vrai ajout au Panier ;
 * - réduire les répétitions visuelles ;
 * - supprimer les grands espaces inutiles ;
 * - donner la priorité au produit, au prix et à l'achat ;
 * - afficher uniquement les informations réellement disponibles ;
 * - conserver la boutique liée à l'offre StoreProduct ;
 * - conserver l'assistance WhatsApp et les informations de livraison.
 *
 * ============================================================================
 */


/* ==========================================================================
   HELPERS
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
   COMPOSANT
   ========================================================================== */

export default function PublicProductDetail({
  product,
}: PublicProductDetailProps) {
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
              size={13}
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
                  size={13}
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
              size={13}
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


      <div
        className={
          styles.productDetailShell
        }
      >
        <div
          className={
            styles.productDetailMain
          }
        >
          <section
            className={
              styles.productDetailGallery
            }
            aria-label={`Galerie de ${product.product.name}`}
          >
            {product.images.length >
            1 ? (
              <div
                className={
                  styles.productDetailThumbnails
                }
                role="group"
                aria-label="Images du produit"
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
                        aria-label={`Afficher l’image ${index + 1}`}
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
                            sizes="84px"
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
                    (max-width: 1199px) 55vw,
                    720px
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
                    size={36}
                    strokeWidth={1.4}
                    aria-hidden="true"
                  />

                  <span>
                    Aucune image
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
                    size={15}
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
          </section>


          <section
            className={
              styles.productDetailCommercial
            }
            aria-labelledby="public-product-detail-title"
          >
            <div
              className={
                styles.productDetailIdentity
              }
            >
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
                      size={13}
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
            </div>


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
                <p
                  className={
                    styles.productDetailSavings
                  }
                >
                  Économie{" "}
                  <strong>
                    {
                      formattedSavings
                    }
                  </strong>
                </p>
              ) : null}
            </div>


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
                    size={19}
                    strokeWidth={1.8}
                  />
                ) : (
                  <CircleAlert
                    size={19}
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
                    en stock
                  </span>
                ) : (
                  <span>
                    Achat indisponible
                  </span>
                )}
              </div>
            </div>


            <div
              className={
                styles.productDetailPurchaseCard
              }
            >
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
                        size={16}
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
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              ) : null}


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
                redirectToPanierAfterAdd
              />


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
                    size={16}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  Panier
                </Link>

                <Link
                  href={
                    generalAppRoutes.checkout
                  }
                  className={
                    styles.productDetailCheckoutLink
                  }
                >
                  Commander

                  <ChevronRight
                    size={15}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>


            <section
              className={
                styles.productDetailStoreCard
              }
              aria-labelledby="public-product-store-title"
            >
              <span
                className={
                  styles.productDetailStoreIcon
                }
                aria-hidden="true"
              >
                <Store
                  size={20}
                  strokeWidth={1.8}
                />
              </span>

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
                  Point de vente
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
                    size={14}
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
                  styles.productDetailStoreWhatsapp
                }
                aria-label="Contacter L&E Cosmetics sur WhatsApp"
              >
                <MessageCircle
                  size={18}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </a>
            </section>
          </section>
        </div>


        {hasDetailedInformation ? (
          <section
            className={
              styles.productDetailInformation
            }
            aria-labelledby="public-product-information-title"
          >
            <header
              className={
                styles.productDetailSectionHeader
              }
            >
              <p
                className={
                  styles.productDetailSectionEyebrow
                }
              >
                Détails
              </p>

              <h2
                id="public-product-information-title"
                className={
                  styles.productDetailSectionTitle
                }
              >
                Informations produit
              </h2>
            </header>


            <div
              className={
                styles.productDetailInformationGrid
              }
            >
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
                      styles.productDetailInformationHeading
                    }
                  >
                    <Info
                      size={18}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <h3>
                      Description
                    </h3>
                  </div>

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
                </section>
              ) : null}


              {hasTechnicalInformation ? (
                <section
                  className={
                    styles.productDetailInformationBlock
                  }
                >
                  <div
                    className={
                      styles.productDetailInformationHeading
                    }
                  >
                    <Tag
                      size={18}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <h3>
                      Caractéristiques
                    </h3>
                  </div>

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
                          Contenance
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
                  </dl>
                </section>
              ) : null}


              {product.content
                .usageInstructions ? (
                <section
                  className={
                    styles.productDetailInformationBlock
                  }
                >
                  <div
                    className={
                      styles.productDetailInformationHeading
                    }
                  >
                    <Check
                      size={18}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <h3>
                      Utilisation
                    </h3>
                  </div>

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


              {product.content
                .ingredients ? (
                <section
                  className={
                    styles.productDetailInformationBlock
                  }
                >
                  <div
                    className={
                      styles.productDetailInformationHeading
                    }
                  >
                    <Info
                      size={18}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <h3>
                      Ingrédients
                    </h3>
                  </div>

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
              Livraison
            </p>

            <h2
              id="public-product-delivery-title"
              className={
                styles.productDetailDeliveryTitle
              }
            >
              Afrique & international
            </h2>

            <p
              className={
                styles.productDetailDeliveryDescription
              }
            >
              Frais et délais selon la destination.
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
              <Truck
                size={21}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <div>
                <h3>
                  Afrique
                </h3>

                <p>
                  Destinations desservies.
                </p>
              </div>
            </article>

            <article
              className={
                styles.productDetailDeliveryCard
              }
            >
              <Globe2
                size={21}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <div>
                <h3>
                  International
                </h3>

                <p>
                  Selon destination.
                </p>
              </div>
            </article>

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
                size={21}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <div>
                <strong>
                  WhatsApp
                </strong>

                <span>
                  Vérifier la livraison
                </span>
              </div>

              <ChevronRight
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </a>
          </div>
        </section>


        <section
          className={
            styles.productDetailFinalCta
          }
          aria-label="Continuer vos achats"
        >
          <div>
            <p
              className={
                styles.productDetailFinalCtaEyebrow
              }
            >
              L&amp;E Cosmetics Empire
            </p>

            <h2
              className={
                styles.productDetailFinalCtaTitle
              }
            >
              Découvrir d&apos;autres produits
            </h2>
          </div>

          <Link
            href={
              PUBLIC_NAVIGATION_ROUTES.PRODUCTS
            }
            className={
              styles.productDetailFinalPrimaryAction
            }
          >
            Voir les produits

            <ChevronRight
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          </Link>
        </section>
      </div>
    </article>
  );
}