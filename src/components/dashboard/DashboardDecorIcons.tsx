import Image from "next/image";
import type { CSSProperties } from "react";

const ICONS = [
  {
    src: "/3d-icons/dashboard-calculator.png",
    cls: "left-5 top-[21rem] hidden 2xl:block w-20",
    delay: "0.5s",
    dur: "7.8s",
  },
  {
    src: "/3d-icons/dashboard-pencil-case.png",
    cls: "right-5 top-[21rem] hidden 2xl:block w-24",
    delay: "1.3s",
    dur: "8.4s",
  },
];

export function DashboardDecorIcons() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-visible">
      {ICONS.map((icon) => (
        <Image
          key={icon.src}
          src={icon.src}
          alt=""
          aria-hidden="true"
          width={220}
          height={220}
          className={`floating-3d absolute select-none object-contain opacity-95 ${icon.cls}`}
          style={
            {
              "--float-delay": icon.delay,
              "--float-duration": icon.dur,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
