import Layout from "@/components/layout/Layout";
import DropHero from "@/components/home/DropHero";
import CollectionGrid from "@/components/home/CollectionGrid";
import SocialStrip from "@/components/home/SocialStrip";

const Index = () => {
  return (
    <Layout homepage>
      <DropHero />
      <CollectionGrid title="Outwear" limit={6} />
      <SocialStrip />
    </Layout>
  );
};

export default Index;
