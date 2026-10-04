// src/state/AchatPremiumContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { useIAP, ErrorCode, type Purchase, type PurchaseError } from 'expo-iap';
import { useEtat } from './EtatContext';
import { SKU_PREMIUM, PRIX_PREMIUM_INDICATIF } from '../config/monetisation';
import { logAchatPremiumAnnule } from '../services/analytics';

// Message volontairement générique : les codes d'erreur du store (réseau, produit
// indisponible, facturation désactivée) n'aident pas l'utilisateur, qui n'a de toute façon
// qu'une action possible. L'erreur technique part dans la console pour le diagnostic.
const MESSAGE_ECHEC_ACHAT = "L'achat n'a pas pu aboutir. Vérifiez votre connexion, puis réessayez.";

// Garde-fou du drapeau `achatEnCours`. `requestPurchase` se résout dès l'ouverture de la
// feuille du store, pas à l'issue de l'achat : le drapeau ne retombe donc que sur
// onPurchaseSuccess ou onPurchaseError. Sur Android ces rappels peuvent ne jamais arriver —
// application mise en arrière-plan pendant le paiement, processus Play Store tué, achat
// laissé en attente d'un paiement différé. Le drapeau resterait alors vrai indéfiniment et
// `lancerAchatPremium` sortirait immédiatement : le bouton Premium devient inerte jusqu'au
// redémarrage complet de l'application, sans le moindre message.
//
// Relâcher le drapeau n'annule aucun achat : il ne fait que rendre le bouton à nouveau
// utilisable. Si l'achat aboutit malgré tout, onPurchaseSuccess active Premium comme prévu.
const DELAI_MAX_ACHAT_MS = 90_000;
// Au retour au premier plan, la feuille du store est forcément refermée. On laisse toutefois
// un court délai : sur Android le rappel de succès arrive parfois juste après la reprise.
const DELAI_RETOUR_PREMIER_PLAN_MS = 4_000;

type AchatPremiumContextValue = {
  // Prix localisé récupéré du store ; retombe sur une valeur indicative tant qu'il n'est pas connu.
  prixPremium: string;
  achatEnCours: boolean;
  restaurationEnCours: boolean;
  // Non nul après un échec à signaler à l'utilisateur. Une annulation volontaire n'en produit
  // pas : la personne sait ce qu'elle vient de faire, lui afficher une erreur serait absurde.
  erreurAchat: string | null;
  lancerAchatPremium: () => void;
  restaurerAchats: () => void;
};

const AchatPremiumContext = createContext<AchatPremiumContextValue | undefined>(undefined);

function estAchatPremiumValide(purchase: Purchase): boolean {
  return purchase.productId === SKU_PREMIUM && purchase.purchaseState === 'purchased';
}

function estAnnulationUtilisateur(error: unknown): boolean {
  return (error as PurchaseError | undefined)?.code === ErrorCode.UserCancelled;
}

export function AchatPremiumProvider({ children }: { children: ReactNode }) {
  const { etat, activerPremium } = useEtat();
  const [achatEnCours, setAchatEnCours] = useState(false);
  const [restaurationEnCours, setRestaurationEnCours] = useState(false);
  const [erreurAchat, setErreurAchat] = useState<string | null>(null);
  // Une seule vérification silencieuse par session, pas à chaque re-render.
  const restaurationAutoFaite = useRef(false);

  const {
    connected,
    products,
    availablePurchases,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    restorePurchases,
    getAvailablePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      setAchatEnCours(false);
      setErreurAchat(null);
      if (estAchatPremiumValide(purchase)) {
        activerPremium(
          purchase.transactionId ?? purchase.purchaseToken ?? purchase.id,
          ...montantFacture()
        );
      }
      try {
        // Non consommable : il s'agit d'un déblocage définitif, pas d'un jeton réutilisable.
        await finishTransaction({ purchase, isConsumable: false });
      } catch (e) {
        console.warn('Finalisation de l\'achat premium impossible', e);
      }
    },
    onPurchaseError: (error) => {
      setAchatEnCours(false);
      if (estAnnulationUtilisateur(error)) {
        setErreurAchat(null);
      } else {
        console.warn('Erreur achat premium', error);
        setErreurAchat(MESSAGE_ECHEC_ACHAT);
      }
      logAchatPremiumAnnule();
    },
  });

  // Montant réellement facturé, lorsque le store l'a communiqué. `displayPrice` est localisé
  // et inexploitable en nombre ; le prix numérique et la devise ne sont pas garantis par
  // toutes les plateformes, d'où la vérification de type plutôt qu'une conversion forcée :
  // pour la mesure du chiffre d'affaires, mieux vaut aucun montant qu'un montant inventé.
  const montantFacture = useCallback((): [number | undefined, string | undefined] => {
    const produit = products.find((p) => p.id === SKU_PREMIUM) as
      | { price?: unknown; currency?: unknown }
      | undefined;
    return [
      typeof produit?.price === 'number' ? produit.price : undefined,
      typeof produit?.currency === 'string' ? produit.currency : undefined,
    ];
  }, [products]);

  // Récupère le prix réel (localisé) dès que la connexion au store est établie.
  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: [SKU_PREMIUM], type: 'in-app' }).catch((e: unknown) =>
      console.warn('Récupération du produit Premium impossible', e)
    );
  }, [connected, fetchProducts]);

  // Restauration silencieuse une fois par session : l'entitlement Google Play reste la
  // source de vérité en cas de réinstallation ou de changement d'appareil, sans action
  // requise de l'utilisateur (le bouton "Restaurer mes achats" reste dispo en secours).
  useEffect(() => {
    if (!connected || etat.premium || restaurationAutoFaite.current) return;
    restaurationAutoFaite.current = true;
    getAvailablePurchases().catch((e: unknown) =>
      console.warn('Vérification des achats existants impossible', e)
    );
  }, [connected, etat.premium, getAvailablePurchases]);

  useEffect(() => {
    const achatPremium = availablePurchases.find(estAchatPremiumValide);
    if (achatPremium) {
      activerPremium(
        achatPremium.transactionId ?? achatPremium.purchaseToken ?? achatPremium.id,
        ...montantFacture()
      );
    }
  }, [availablePurchases, activerPremium, montantFacture]);

  // Voir DELAI_MAX_ACHAT_MS : sans cela, un achat dont le store ne notifie jamais l'issue
  // condamne le bouton Premium pour toute la durée de vie du processus.
  useEffect(() => {
    if (!achatEnCours) return;

    let repli: ReturnType<typeof setTimeout> | undefined;
    const butoir = setTimeout(() => setAchatEnCours(false), DELAI_MAX_ACHAT_MS);

    const abonnement = AppState.addEventListener('change', (etatApp) => {
      if (etatApp !== 'active') return;
      clearTimeout(repli);
      repli = setTimeout(() => setAchatEnCours(false), DELAI_RETOUR_PREMIER_PLAN_MS);
    });

    return () => {
      clearTimeout(butoir);
      clearTimeout(repli);
      abonnement.remove();
    };
  }, [achatEnCours]);

  const lancerAchatPremium = useCallback(() => {
    if (etat.premium || achatEnCours) return;
    // Efface l'échec précédent : une nouvelle tentative repart d'un écran propre.
    setErreurAchat(null);
    setAchatEnCours(true);
    // Les deux magasins attendent une forme différente et ne partagent rien : un achat
    // effectué sur Google Play ne débloque pas un iPhone, et le produit doit être créé
    // séparément dans App Store Connect sous le même identifiant.
    requestPurchase({
      request: { google: { skus: [SKU_PREMIUM] }, apple: { sku: SKU_PREMIUM } },
      type: 'in-app',
    }).catch(
      (e: unknown) => {
        setAchatEnCours(false);
        if (!estAnnulationUtilisateur(e)) {
          console.warn('Lancement de l\'achat premium impossible', e);
          setErreurAchat(MESSAGE_ECHEC_ACHAT);
        }
      }
    );
  }, [etat.premium, achatEnCours, requestPurchase]);

  const restaurerAchats = useCallback(() => {
    setRestaurationEnCours(true);
    restorePurchases()
      .then(() => getAvailablePurchases())
      .catch((e: unknown) => console.warn('Restauration des achats impossible', e))
      .finally(() => setRestaurationEnCours(false));
  }, [restorePurchases, getAvailablePurchases]);

  const prixPremium = products.find((p) => p.id === SKU_PREMIUM)?.displayPrice ?? PRIX_PREMIUM_INDICATIF;

  const value = useMemo(
    () => ({ prixPremium, achatEnCours, restaurationEnCours, erreurAchat, lancerAchatPremium, restaurerAchats }),
    [prixPremium, achatEnCours, restaurationEnCours, erreurAchat, lancerAchatPremium, restaurerAchats]
  );

  return <AchatPremiumContext.Provider value={value}>{children}</AchatPremiumContext.Provider>;
}

export function useAchatPremium(): AchatPremiumContextValue {
  const ctx = useContext(AchatPremiumContext);
  if (!ctx) throw new Error("useAchatPremium doit être utilisé à l'intérieur de <AchatPremiumProvider>");
  return ctx;
}
