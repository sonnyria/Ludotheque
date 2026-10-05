# Used price correction implementation plan

Goal: replace unsupported market-source claims and inconsistent automatic prices with platform-aware estimates and optional verified PAL PriceCharting consultations.

Architecture: local indicative calculator remains available offline. Server consults a matching PAL product, reads condition-specific price and the page USD/EUR exchange rate, returning source URL and consultation time. Add-game form requests this quote with stale-result guards; saved quotes retain metadata.

Constraints: no paid API, no AI invented prices, no cross-platform or collector-edition match, no forced conversion without exchange-rate evidence. Keep user-entered prices. Do not claim PAL means French-specific pricing.

Review focus: wrong sequel/edition, USD interpreted as EUR, old asynchronous responses, digital resale value, unknown/blocked source.

- [x] Add failing calculator tests for platform, accents, condition and edition.
- [x] Scope existing reference table by console and remove broad franchise rules.
- [x] Add failing source-parser/lookup tests including currency, edition and failure.
- [x] Implement server lookup and replace AI estimate-price endpoint.
- [x] Wire automatic and explicit consultation in form; persist and display provenance, correct help text.
- [x] Run full tests, TypeScript and web build; independent review; publish and check live quote endpoint.
