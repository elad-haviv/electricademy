import { PRIVACY_DETAILS, SITE_OWNER } from "./siteOwner";

/**
 * Owner facts as the privacy and cookie pages use them. The values live in ./siteOwner.ts (the one file the owner
 * edits); this only maps them to the names those pages use.
 */
export const LEGAL = {
  controllerName: SITE_OWNER.legalName,
  controllerId: SITE_OWNER.companyId,
  controllerAddress: SITE_OWNER.postalAddress,
  privacyEmail: SITE_OWNER.privacyEmail,
  ...PRIVACY_DETAILS,
} as const;
