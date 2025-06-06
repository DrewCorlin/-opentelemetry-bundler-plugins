/*
 * Copyright The Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Instrumentation,
  InstrumentationBase,
  InstrumentationModuleDefinition,
} from "@opentelemetry/instrumentation";
import { OtelPluginInstrumentationConfigMap } from "./types";

function getModuleDefinitions(
  instrumentation: Instrumentation
): InstrumentationModuleDefinition[] {
  if (instrumentation instanceof InstrumentationBase) {
    return instrumentation.getModuleDefinitions() ?? [];
  }

  return [];
}

function configGenerator<T extends { enabled?: boolean }>(
  config?: T
): string | undefined {
  if (!config) return;
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(config).filter(([, v]) => typeof v !== "function")
    )
  );
}

export function getOtelPackageToInstrumentationConfig(
  instrumentations: Instrumentation[]
) {
  const instrumentationModuleDefinitionsByInstrumentationName =
    Object.fromEntries(
      instrumentations.map((i) => [
        i.instrumentationName,
        getModuleDefinitions(i),
      ])
    );

  const instrumentationModuleDefinitions = Object.values(
    instrumentationModuleDefinitionsByInstrumentationName
  ).flat();

  const otelPackageToInstrumentationConfig: Record<
    string,
    {
      oTelInstrumentationPackage: keyof OtelPluginInstrumentationConfigMap;
      oTelInstrumentationClass: string;
      configGenerator: <T extends { enabled?: boolean }>(
        config?: T
      ) => string | undefined;
    }
  > = {};
  for (const instrumentation of instrumentations) {
    const moduleDefinitions =
      instrumentationModuleDefinitionsByInstrumentationName[
        instrumentation.instrumentationName
      ];

    for (const instrumentationModuleDefinition of moduleDefinitions) {
      otelPackageToInstrumentationConfig[instrumentationModuleDefinition.name] =
        {
          oTelInstrumentationPackage:
            instrumentation.instrumentationName as keyof OtelPluginInstrumentationConfigMap,
          oTelInstrumentationClass: instrumentation.constructor.name,
          configGenerator,
        };
    }
  }
  return {
    otelPackageToInstrumentationConfig,
    instrumentationModuleDefinitions,
  };
}
