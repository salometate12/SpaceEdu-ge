"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUserAccess } from "@/hooks/useCurrentUserAccess";
import { readActiveSpaceCookie, resolveWorkingSpace } from "@/lib/active-space";
import { readSpaceeduSpace, type SpaceeduSpace } from "@/lib/space-back-navigation";

/**
 * The client side of `resolveWorkingSpace`: URL → remembered cookie →
 * account space, with the device's last space (localStorage) as a final
 * fallback for signed-out / dev use. Re-reads the cookie on every
 * navigation, since the middleware may have just updated it.
 */
export function useWorkingSpace(): { space: SpaceeduSpace | null; isAdmin: boolean } {
  const pathname = usePathname();
  const { space: accountSpace, isAdmin } = useCurrentUserAccess();
  const [stored, setStored] = useState<{
    cookie: SpaceeduSpace | null;
    local: SpaceeduSpace | null;
  }>({ cookie: null, local: null });

  useEffect(() => {
    const sync = () => {
      const cookie = readActiveSpaceCookie();
      // Keep the older localStorage key in step with the cookie; other
      // screens (back links, the assistant hub) still read it.
      if (cookie && readSpaceeduSpace() !== cookie) {
        window.localStorage.setItem("spaceedu_space", cookie);
      }
      setStored({ cookie, local: readSpaceeduSpace() });
    };
    sync();
  }, [pathname]);

  const space =
    resolveWorkingSpace({ pathname, cookieSpace: stored.cookie, accountSpace }) ?? stored.local;
  return { space, isAdmin };
}
