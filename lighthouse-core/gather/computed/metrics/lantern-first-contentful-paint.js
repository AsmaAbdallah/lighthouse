/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const MetricArtifact = require('./lantern-metric');
const Node = require('../../../lib/dependency-graph/node');

/** @typedef {Node.NodeType} NodeType */

class FirstContentfulPaint extends MetricArtifact {
  get name() {
    return 'LanternFirstContentfulPaint';
  }

  /**
   * @return {LH.Gatherer.Simulation.MetricCoefficients}
   */
  get COEFFICIENTS() {
    return {
      intercept: 600,
      optimistic: 0.6,
      pessimistic: 0.5,
    };
  }

  /**
   * @param {NodeType} dependencyGraph
   * @param {LH.Artifacts.TraceOfTab} traceOfTab
   * @return {NodeType}
   */
  getOptimisticGraph(dependencyGraph, traceOfTab) {
    const fcp = traceOfTab.timestamps.firstContentfulPaint;
    const blockingScriptUrls = MetricArtifact.getScriptUrls(dependencyGraph, node => {
      return (
        node.endTime <= fcp && node.hasRenderBlockingPriority() && node.initiatorType !== 'script'
      );
    });

    return dependencyGraph.cloneWithRelationships(node => {
      if (node.endTime > fcp && !node.isMainDocument()) return false;
      // Include EvaluateScript tasks for blocking scripts
      if (node.type === Node.TYPES.CPU) {
        return node.isEvaluateScriptFor(blockingScriptUrls);
      }

      // Include non-script-initiated network requests with a render-blocking priority
      return node.hasRenderBlockingPriority() && node.initiatorType !== 'script';
    });
  }

  /**
   * @param {NodeType} dependencyGraph
   * @param {LH.Artifacts.TraceOfTab} traceOfTab
   * @return {NodeType}
   */
  getPessimisticGraph(dependencyGraph, traceOfTab) {
    const fcp = traceOfTab.timestamps.firstContentfulPaint;
    const blockingScriptUrls = MetricArtifact.getScriptUrls(dependencyGraph, node => {
      return node.endTime <= fcp && node.hasRenderBlockingPriority();
    });

    return dependencyGraph.cloneWithRelationships(node => {
      if (node.endTime > fcp && !node.isMainDocument()) return false;
      // Include EvaluateScript tasks for blocking scripts
      if (node.type === Node.TYPES.CPU) {
        return node.isEvaluateScriptFor(blockingScriptUrls);
      }

      // Include non-script-initiated network requests with a render-blocking priority
      return node.hasRenderBlockingPriority();
    });
  }
}

module.exports = FirstContentfulPaint;
