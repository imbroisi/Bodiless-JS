/**
 * Copyright © 2021 Johnson & Johnson
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { ComponentType } from 'react';
import {
  useNode, ContentNode, useContextMenuForm,
  createMenuOptionGroup, withMenuOptions, NodeProvider,
} from '@bodiless/core';
import type { OptionGroupDefinition } from '@bodiless/core';
import type { ComponentOrTag } from '@bodiless/fclasses';
import { observer } from 'mobx-react-lite';
import flow from 'lodash/flow';
import ComponentSelector from '../ComponentSelector';
import type { ComponentSelectorProps, Meta, ComponentWithMeta } from '../ComponentSelector/types';

export type ContentLibraryOptions = {
  useLibraryNode: (props: any) => { node: ContentNode<any> },
  DisplayComponent?: ComponentType<any>,
  Selector?: ComponentType<ComponentSelectorProps>,
  useMeta?: (node: ContentNode<any>) => Partial<Meta>|null,
  useOverrides?: (props: any) => Partial<OptionGroupDefinition>,
};

/**
 * Get child key of given node.
 *
 * Might refactor to @bodiless/core
 * https://github.com/johnsonandjohnson/Bodiless-JS/issues/1160
 *
 * @param node ContentNode
 * @returns keys string[]
 */
export const childKeys = (node: ContentNode<any>) => {
  const aParent = node.path;
  const aCandidates = node.keys.map(key => key.split('$'));
  return Object.keys(aCandidates.reduce(
    (acc, next) => {
      if (next.length <= aParent.length) return acc;
      for (let i = 0; i < aParent.length; i += 1) {
        if (aParent[i] !== next[i]) return acc;
      }
      return { ...acc, [next[aParent.length]]: true };
    },
    {},
  ));
};

const copyNode = (source: ContentNode<any>, dest: ContentNode<any>, copyChildren: boolean) => {
  dest.setData(source.data);
  if (copyChildren) {
    childKeys(source).forEach(key => copyNode(source.child(key), dest.child(key), true));
  }
};

const withContentLibrary = (options: ContentLibraryOptions) => <P extends object>(
  Component: ComponentOrTag<P>,
) => {
  const {
    DisplayComponent = Component,
    Selector = ComponentSelector,
    useLibraryNode,
    useMeta,
    useOverrides = () => {},
  } = options;

  const useMenuOptions = (props: any) => {
    const { node: targetNode } = useNode();
    const { node: libraryNode } = useLibraryNode(props);
    const keys = childKeys(libraryNode);

    const components = keys.map(key => {
      const node = libraryNode.child(key);
      const ComponentWithNode: ComponentWithMeta = () => (
        <NodeProvider node={node}>
          <DisplayComponent />
        </NodeProvider>
      );
      ComponentWithNode.displayName = key;
      ComponentWithNode.title = key;
      ComponentWithNode.description = key;

      if (useMeta) {
        const meta = useMeta(node);
        // If createMeta returns null or undefined, it means do not use this node.
        if (!meta) return null;
        Object.assign(ComponentWithNode, meta);
      }
      return ComponentWithNode;
    }).filter(Boolean) as ComponentWithMeta[];

    const renderForm = ({ closeForm }:any) => {
      const onSelect = ([name]: string[]) => {
        if (name) {
          copyNode(libraryNode.child(name), targetNode, true);
        }
        closeForm(null);
      };
      return (
        <Selector
          closeForm={closeForm}
          onSelect={onSelect}
          components={components}
        />
      );
    };
    const form = useContextMenuForm({ renderForm, hasSubmit: false });
    const baseOption: OptionGroupDefinition = {
      name: 'content-library',
      label: 'Library',
      groupLabel: 'Content',
      groupMerge: 'merge',
      icon: 'account_balance',
      local: true,
      global: false,
      formTitle: 'Content Library',
      formDescription: 'Select the content you wish to insert.',
      isHidden: !components.length,
    };
    const finalOption = {
      ...baseOption,
      ...useOverrides(props),
      handler: () => form,
    };
    return createMenuOptionGroup(finalOption);
  };
  return flow(
    withMenuOptions({ useMenuOptions, name: 'Content Library' }),
    observer,
  )(Component);
};

export default withContentLibrary;
