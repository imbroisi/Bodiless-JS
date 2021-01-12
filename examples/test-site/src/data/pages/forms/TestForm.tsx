/**
 * Copyright © 2020 Johnson & Johnson
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

/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useCallback } from 'react';
import { Form } from 'informed';
import MarkdownField from './InformedMarkdown';

const TestForm = () => {
  const [values, setValues] = useState({ values: { md: '' } });
  const onSubmit = useCallback(v => {
    setValues({ values: v });
  }, [setValues]);
  return (
    <>
      <Form
        onSubmit={onSubmit}
        initialValues={{
          md: '# This is the initial value',
        }}
      >
        <label>
          Text:
          <MarkdownField field="md" />
        </label>
        <button type="submit">Submit</button>
      </Form>
      <div>
        Submitted values
        <pre>
          {JSON.stringify(values.values, null, 2)}
        </pre>
      </div>
    </>
  );
};

export default TestForm;
