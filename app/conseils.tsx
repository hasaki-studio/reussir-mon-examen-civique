import { useRouter } from 'expo-router';
import ConseilsRevision from '../src/screens/ConseilsRevision';

export default function ConseilsRoute() {
  const router = useRouter();
  return <ConseilsRevision onRetour={() => router.back()} />;
}
