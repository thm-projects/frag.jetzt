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
        - https://m3.material.io/components/cards/specs#9abbced9-d5d3-4893-9a67-031825205f06
        - e.g.: padding between cards
      - `medium` 12px
      - `large` 24px
    - new values can be added at `_get-default-token()`\
      for custom adjustments use component style instead
