import type { Dispatch, SetStateAction } from "react";

import type { ResourceForms, ResourceKey } from "../types";

export function updateResourceFormValue(
  setForms: Dispatch<SetStateAction<ResourceForms>>,
  resource: ResourceKey,
  fieldName: string,
  value: string,
) {
  setForms((current) => ({
    ...current,
    [resource]: {
      ...current[resource],
      [fieldName]: value,
    },
  }));
}
