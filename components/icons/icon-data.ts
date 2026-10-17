export const centralIconsMetadata = {
  "IconArrowLeft": {"title":"arrow-left"},
  "IconArrowRight": {"title":"arrow-right"},
  "IconBarsTwo": {"title":"bars-two, menu simple, nav simple"}
} as const;

export type CentralIconName = keyof typeof centralIconsMetadata;
export type CentralIconJoin = "square";
export type CentralIconFill = "outlined" | "filled";
export type CentralIconRadius = "0";
export type CentralIconStroke = "1" | "1.5" | "2";
export type CentralIconPackageName =
  `${CentralIconJoin}-${CentralIconFill}-radius-${CentralIconRadius}-stroke-${CentralIconStroke}`;
export type CentralIconImportName =
  `${CentralIconPackageName}/${CentralIconName}`;

export const centralIcons = {
  "square-outlined-radius-0-stroke-1/IconArrowLeft": "<path d=\"M10 5.5L3.5 12L10 18.5\" stroke=\"currentColor\" stroke-linecap=\"square\"/><path d=\"M4 12H20.5\" stroke=\"currentColor\" stroke-linecap=\"square\"/>",
  "square-outlined-radius-0-stroke-1.5/IconArrowLeft": "<path d=\"M10 5.75L3.75 12L10 18.25\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"square\"/><path d=\"M4.5 12H20.25\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"square\"/>",
  "square-outlined-radius-0-stroke-2/IconArrowLeft": "<path d=\"M10 6L4 12L10 18\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"square\"/><path d=\"M5 12H20\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"square\"/>",
  "square-filled-radius-0-stroke-1/IconArrowLeft": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M11.4144 6.00003L6.41437 11H21.0002V13H6.41436L11.4144 18L10.0001 19.4142L2.58594 12L10.0002 4.58582L11.4144 6.00003Z\" fill=\"currentColor\"/>",
  "square-filled-radius-0-stroke-1.5/IconArrowLeft": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M9.99775 19.5177L2.47998 12L9.99774 4.48218L11.7655 6.24994L7.26551 10.75H20.9977V13.25H7.26552L11.7655 17.7499L9.99775 19.5177Z\" fill=\"currentColor\"/>",
  "square-filled-radius-0-stroke-2/IconArrowLeft": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M11.0012 4.37866L3.37988 12L11.0012 19.6213L13.1225 17.5L9.12252 13.5H22.0012V10.5H9.12253L13.1225 6.49999L11.0012 4.37866Z\" fill=\"currentColor\"/>",
  "square-outlined-radius-0-stroke-1/IconArrowRight": "<path d=\"M14 5.5L20.5 12L14 18.5\" stroke=\"currentColor\" stroke-linecap=\"square\"/><path d=\"M20 12H3.5\" stroke=\"currentColor\" stroke-linecap=\"square\"/>",
  "square-outlined-radius-0-stroke-1.5/IconArrowRight": "<path d=\"M14 5.75L20.25 12L14 18.25\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"square\"/><path d=\"M19.5 12H3.75\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"square\"/>",
  "square-outlined-radius-0-stroke-2/IconArrowRight": "<path d=\"M14 6L20 12L14 18\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"square\"/><path d=\"M19 12H4\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"square\"/>",
  "square-filled-radius-0-stroke-1/IconArrowRight": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M14 4.58582L21.4142 12L14 19.4142L12.5858 18L17.5858 13H3V11H17.5858L12.5858 6.00003L14 4.58582Z\" fill=\"currentColor\"/>",
  "square-filled-radius-0-stroke-1.5/IconArrowRight": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M14 4.48224L21.5178 12L14 19.5178L12.2322 17.75L16.7322 13.25H3V10.75H16.7322L12.2322 6.25001L14 4.48224Z\" fill=\"currentColor\"/>",
  "square-filled-radius-0-stroke-2/IconArrowRight": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M14 4.37866L21.6213 12L14 19.6213L11.8787 17.5L15.8787 13.5H3V10.5H15.8787L11.8787 6.49999L14 4.37866Z\" fill=\"currentColor\"/>",
  "square-outlined-radius-0-stroke-1/IconBarsTwo": "<path d=\"M2.5 7.5H21.5M2.5 16.5H21.5\" stroke=\"currentColor\" stroke-linecap=\"square\"/>",
  "square-outlined-radius-0-stroke-1.5/IconBarsTwo": "<path d=\"M2.75 7.25H21.25M2.75 16.75H21.25\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"square\"/>",
  "square-outlined-radius-0-stroke-2/IconBarsTwo": "<path d=\"M3 7H21M3 17H21\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"square\"/>",
  "square-filled-radius-0-stroke-1/IconBarsTwo": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M2 7H22V8H2V7ZM2 16H22V17H2V16Z\" fill=\"currentColor\"/>",
  "square-filled-radius-0-stroke-1.5/IconBarsTwo": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M2 6.5H22V8H2V6.5ZM2 16H22V17.5H2V16Z\" fill=\"currentColor\"/>",
  "square-filled-radius-0-stroke-2/IconBarsTwo": "<path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M2 6H22V8H2V6ZM2 16H22V18H2V16Z\" fill=\"currentColor\"/>"
} as const satisfies Record<CentralIconImportName, string>;
