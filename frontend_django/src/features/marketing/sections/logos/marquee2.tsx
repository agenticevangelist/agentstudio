"use client";

import React from "react";

const logos = [
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807cc5031d43292f87ea4_freewill.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807cce5b6f957a43380ac_avelo.png",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807ccb27f3a73c2d2ce2d_cometeer.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807ccb3c55f83c1017f90_webflow.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807cdc8b7150a4f255b6b_wayup.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807cd74e61b2a157ccf4e_applied%20intuition.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807ce84bece698b0f550d_shortcut.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807ce7994e05ddf461108_nuggs.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807cf967af580795aa07e_marqeta.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807cfb6d9c83c4e88252c_anduril.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807cf0397c035c5101e14_clickup.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807cfa0edabe86a66c616_faire.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807d0cad42db37fbd15c2_818.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623dfbb73c77b4223abae207_Madhappy%20new.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807d122283a0f44a3bb2f_mode.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807d1fbf80eddc2f695ec_eight%20sleep.svg",
  "https://assets-global.website-files.com/5f8dd056c51c1d04c3eaa497/623807d2a2d75c2175c6f6ac_ro.svg",
];

export default function MarqueeNew() {
  return (
    <div className="logo-scroll-wrapper py-4">
      <div className="logo-scroll">
        {logos.concat(logos).map((src, i) => (
          <img key={i} src={src} alt="" className="logo" />
        ))}
      </div>
    </div>
  );
}
