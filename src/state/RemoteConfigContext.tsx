// src/state/RemoteConfigContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { chargerRemoteConfig, VALEURS_PAR_DEFAUT, ValeursRemoteConfig } from '../services/remoteConfig';

const RemoteConfigContext = createContext<ValeursRemoteConfig>(VALEURS_PAR_DEFAUT);

export function RemoteConfigProvider({ children }: { children: ReactNode }) {
  const [valeurs, setValeurs] = useState<ValeursRemoteConfig>(VALEURS_PAR_DEFAUT);

  useEffect(() => {
    let annule = false;
    chargerRemoteConfig().then((v) => {
      if (!annule) setValeurs(v);
    });
    return () => {
      annule = true;
    };
  }, []);

  return <RemoteConfigContext.Provider value={valeurs}>{children}</RemoteConfigContext.Provider>;
}

export function useRemoteConfig(): ValeursRemoteConfig {
  return useContext(RemoteConfigContext);
}
