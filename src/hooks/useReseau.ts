import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useReseau(): boolean {
  const [connecte, setConnecte] = useState(true);

  useEffect(() => {
    const desabonner = NetInfo.addEventListener((state) => {
      setConnecte(state.isConnected !== false);
    });
    return () => desabonner();
  }, []);

  return connecte;
}
