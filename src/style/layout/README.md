# Layout utilities

- `flex-layout.scss`
  - layout direction `display:flex;flex-direction:...;`
    - `.column`
    - `.row`
  - content alignment `justify-content:...;`
    - `<column | row>.content-`
      - `center`
      - `start`
      - `space-between`
      - etc.
  - item alignment
    - `<column | row>.items-`
      - `center`
      - `start`
      - etc.
  - gap `>*+*{margin-(top | left):...;}`
    - `<column | row>.gap-`
      - `small` 8px
      - `medium` 12px
      - `large` 24px
    - new values can be added at `_get-default-token()`\
      for custom adjustments use component style instead
