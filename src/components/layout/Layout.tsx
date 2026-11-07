import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  homepage?: boolean;
}

const Layout = ({ children, homepage = false }: LayoutProps) => {
  return (
    <div className={homepage ? "min-h-screen bg-background" : "min-h-screen flex flex-col"}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer minimal={homepage} />
    </div>
  );
};

export default Layout;
