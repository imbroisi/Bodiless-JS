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

import React, {
  useCallback, useEffect, useState,
} from 'react';
import {
  contextMenuForm,
  useMenuOptionUI,
  useEditContext,
  withMenuOptions,
  useNode,
} from '@bodiless/core';
import BackendClient from './BackendClient';
import handle from './ResponseHandler';
import verifyPage from './PageVerification';
import {
  PageState,
  PageStatus,
  Client,
  getPathValue,
  PageForm,
} from './PageOperations';

const clonePage = async ({ origin, destination, client } : any) => {
  // Clone the page.
  const result = await handle(client.clonePage(origin, destination));

  // If the page was cloned successfully:
  if (result.response) {
    // Verify the clone of the page.
    const isPageVerified = await verifyPage(destination);
    if (!isPageVerified) {
      const errorMessage = `Unable to verify page clone.
        It is likely that your cloned page was cloned but is not yet available.
        Click ok to visit the cloned page; if it does not load, wait a while and reload.`;
      return Promise.reject(new Error(errorMessage));
    }
    return Promise.resolve(destination);
  }
  if (result.message) {
    return Promise.reject(new Error(result.message));
  }
  return Promise.reject(new Error('An internal error occurred. Please try again later.'));
};

const formPageClone = (client: Client) => contextMenuForm({
  submitValues: ({ keepOpen }: any) => keepOpen,
  hasSubmit: ({ keepOpen }: any) => keepOpen,
})(({ formState, formApi } : any) => {
  const { ComponentFormText } = useMenuOptionUI();
  const {
    submits, invalid, values,
  } = formState;
  const [state, setState] = useState<PageStatus>({
    status: PageState.Init,
  });
  const context = useEditContext();
  const origin = useNode().node.pagePath;
  const destination = getPathValue(values);

  useEffect(() => {
    // If the form is submitted and valid then lets try to clone a page.
    if (submits && destination && invalid === false) {
      context.showPageOverlay({ hasSpinner: false });
      setState({ status: PageState.Pending });
      clonePage({ origin, destination, client })
        .then((pagePath: string) => {
          if (pagePath) {
            setState({ status: PageState.Complete, pagePath });
          }
        })
        .catch((err: Error) => {
          setState({ status: PageState.Errored, errorMessage: err.message });
        })
        .finally(() => {
          context.hidePageOverlay();
          formApi.setValue('keepOpen', false);
        });
    }
  }, [submits]);
  const { status, errorMessage, pagePath } = state;
  return (
    <>
      <ComponentFormText type="hidden" field="keepOpen" initialValue />
      <PageForm
        formTitle="Clone (this) Page"
        status={status}
        errorMessage={errorMessage}
        completeMessage="Click here to visit the cloned page"
        titlePending="Cloning Page"
        pagePath={pagePath}
        linkId="clone-page-link"
      />
    </>
  );
});

const defaultClient = new BackendClient();

const useMenuOptions = () => {
  const context = useEditContext();

  const menuOptions = [
    {
      name: 'page-clone',
      icon: 'collections',
      label: 'Clone',
      group: 'page-group',
      isHidden: useCallback(() => !context.isEdit, []),
      handler: () => formPageClone(defaultClient),
    },
  ];
  return menuOptions;
};

const withClonePageButton = withMenuOptions({
  useMenuOptions,
  name: 'ClonePage',
  root: true,
});

export default withClonePageButton;
