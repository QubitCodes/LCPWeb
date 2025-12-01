import Image from "next/image";
import { default as companyIcon } from "../../../public/icons/LCP_PNG_LOGO.png";
import { default as loginBackgroundIcon } from "../../../public/icons/LoginBgImg.png";
import { default as loginBackgroundBottomIcon } from "../../../public/icons/LoginBgImgBottom.png";
import Link from "next/link";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="MainAuthLayout grid grid-cols-1 md:grid-cols-5 w-full h-screen  gap-4">
        <div className="col-span-3 hidden overflow-hidden md:block h-full">
          <div className="w-full h-full md:flex md:flex-col justify-between rounded-2xl bg-white overflow-hidden">
            <div className="p-10">
              <Image
                src={companyIcon} // Make sure to add your logo in public folder
                alt="Logo"
                width={130}
                height={130}
              />
            </div>
            <div className="flex w-full justify-center">
              <Image
                src={loginBackgroundIcon}
                alt="Logo"
                className="w-1/2 h-full"
              />
            </div>
            <Image
              src={loginBackgroundBottomIcon}
              alt="Logo"
              className="w-full"
            />
          </div>
        </div>
        <div className="col-span-5 md:col-span-2 h-full">
          <div className="w-full h-full rounded-2xl bg-background flex flex-col">
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
              <div className="w-full p-14 pt-0 pb-0">{children}</div>
            </div>
            <footer className="flex flex-col items-center gap-1 py-4 text-[#8C8C8C] text-sm">
              <div>
                Copyright <b>&copy;</b> Aries Group of Companies
              </div>
              <div>
                Designed & Developed By{" "}
                <b>
                  <Link href="https://qubit.codes">Qubit Codes</Link>
                </b>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </>
  );
}
