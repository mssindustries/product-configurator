import { Button, Card } from '../components/ui';

/**
 * Style Guide Page - Preview all UI components and their variants.
 * Access at /style-guide (no navigation link).
 */
export default function StyleGuidePage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Style Guide</h1>
        <p className="text-neutral-600 mb-8">
          UI component library with CVA variants and design tokens.
        </p>

        {/* Buttons Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Button</h2>
          <Card>
            <Card.Body className="space-y-6">
              {/* Intent Variants */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">Intent Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Button intent="primary">Primary</Button>
                  <Button intent="secondary">Secondary</Button>
                  <Button intent="danger">Danger</Button>
                  <Button intent="ghost">Ghost</Button>
                </div>
              </div>

              {/* Size Variants */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">Size Variants</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              {/* States */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">States</h3>
                <div className="flex flex-wrap gap-3">
                  <Button>Default</Button>
                  <Button disabled>Disabled</Button>
                  <Button isLoading>Loading</Button>
                  <Button intent="danger" isLoading>
                    Deleting
                  </Button>
                </div>
              </div>

              {/* Combined Variants */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">Combined</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button intent="primary" size="sm">Primary SM</Button>
                  <Button intent="secondary" size="lg">Secondary LG</Button>
                  <Button intent="danger" size="sm">Danger SM</Button>
                  <Button intent="ghost" size="lg">Ghost LG</Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </section>

        {/* Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Card</h2>

          <div className="space-y-6">
            {/* Default Card */}
            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-3">Default (with shadow)</h3>
              <Card>
                <Card.Header>
                  <h4 className="text-lg font-semibold">Card Header</h4>
                </Card.Header>
                <Card.Body>
                  <p className="text-neutral-600">
                    This is the card body content. Cards use a compound component pattern
                    with Header, Body, and Footer sub-components.
                  </p>
                </Card.Body>
                <Card.Footer>
                  <Button intent="primary" size="sm">Save</Button>
                  <Button intent="ghost" size="sm">Cancel</Button>
                </Card.Footer>
              </Card>
            </div>

            {/* Outlined Card */}
            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-3">Outlined Variant</h3>
              <Card variant="outlined">
                <Card.Header>
                  <h4 className="text-lg font-semibold">Outlined Card</h4>
                </Card.Header>
                <Card.Body>
                  <p className="text-neutral-600">
                    This card uses the outlined variant with a border instead of shadow.
                  </p>
                </Card.Body>
                <Card.Footer>
                  <Button intent="secondary" size="sm">Action</Button>
                </Card.Footer>
              </Card>
            </div>

            {/* Card with Padding */}
            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-3">With Padding (no sub-components)</h3>
              <div className="flex gap-4">
                <Card padding="sm" className="flex-1">
                  <p className="text-sm text-neutral-600">Small padding</p>
                </Card>
                <Card padding="md" className="flex-1">
                  <p className="text-sm text-neutral-600">Medium padding</p>
                </Card>
                <Card padding="lg" className="flex-1">
                  <p className="text-sm text-neutral-600">Large padding</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Design Tokens Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-neutral-800 mb-4">Design Tokens</h2>
          <Card>
            <Card.Body className="space-y-6">
              {/* Colors */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">Colors</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="text-xs text-neutral-500 w-16">Primary</span>
                    <div className="flex gap-1">
                      {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                        <div
                          key={shade}
                          className={`w-8 h-8 rounded bg-primary-${shade}`}
                          title={`primary-${shade}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs text-neutral-500 w-16">Neutral</span>
                    <div className="flex gap-1">
                      {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                        <div
                          key={shade}
                          className={`w-8 h-8 rounded bg-neutral-${shade}`}
                          title={`neutral-${shade}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs text-neutral-500 w-16">Success</span>
                    <div className="flex gap-1">
                      <div className="w-8 h-8 rounded bg-success-50" title="success-50" />
                      <div className="w-8 h-8 rounded bg-success-500" title="success-500" />
                      <div className="w-8 h-8 rounded bg-success-600" title="success-600" />
                      <div className="w-8 h-8 rounded bg-success-700" title="success-700" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs text-neutral-500 w-16">Warning</span>
                    <div className="flex gap-1">
                      <div className="w-8 h-8 rounded bg-warning-50" title="warning-50" />
                      <div className="w-8 h-8 rounded bg-warning-500" title="warning-500" />
                      <div className="w-8 h-8 rounded bg-warning-600" title="warning-600" />
                      <div className="w-8 h-8 rounded bg-warning-700" title="warning-700" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs text-neutral-500 w-16">Danger</span>
                    <div className="flex gap-1">
                      <div className="w-8 h-8 rounded bg-danger-50" title="danger-50" />
                      <div className="w-8 h-8 rounded bg-danger-500" title="danger-500" />
                      <div className="w-8 h-8 rounded bg-danger-600" title="danger-600" />
                      <div className="w-8 h-8 rounded bg-danger-700" title="danger-700" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Spacing */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">Spacing</h3>
                <div className="flex items-end gap-4">
                  <div className="text-center">
                    <div className="w-xs h-xs bg-primary-500 mb-1" />
                    <span className="text-xs text-neutral-500">xs</span>
                  </div>
                  <div className="text-center">
                    <div className="w-sm h-sm bg-primary-500 mb-1" />
                    <span className="text-xs text-neutral-500">sm</span>
                  </div>
                  <div className="text-center">
                    <div className="w-md h-md bg-primary-500 mb-1" />
                    <span className="text-xs text-neutral-500">md</span>
                  </div>
                  <div className="text-center">
                    <div className="w-lg h-lg bg-primary-500 mb-1" />
                    <span className="text-xs text-neutral-500">lg</span>
                  </div>
                  <div className="text-center">
                    <div className="w-xl h-xl bg-primary-500 mb-1" />
                    <span className="text-xs text-neutral-500">xl</span>
                  </div>
                  <div className="text-center">
                    <div className="w-2xl h-2xl bg-primary-500 mb-1" />
                    <span className="text-xs text-neutral-500">2xl</span>
                  </div>
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">Border Radius</h3>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary-500 rounded-sm mb-1" />
                    <span className="text-xs text-neutral-500">sm</span>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary-500 rounded-md mb-1" />
                    <span className="text-xs text-neutral-500">md</span>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary-500 rounded-lg mb-1" />
                    <span className="text-xs text-neutral-500">lg</span>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary-500 rounded-xl mb-1" />
                    <span className="text-xs text-neutral-500">xl</span>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary-500 rounded-full mb-1" />
                    <span className="text-xs text-neutral-500">full</span>
                  </div>
                </div>
              </div>

              {/* Shadows */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 mb-3">Shadows</h3>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-lg shadow-sm mb-2" />
                    <span className="text-xs text-neutral-500">sm</span>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-lg shadow-md mb-2" />
                    <span className="text-xs text-neutral-500">md</span>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-lg shadow-lg mb-2" />
                    <span className="text-xs text-neutral-500">lg</span>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </section>

        <footer className="text-center text-sm text-neutral-500 py-8">
          Access this page at <code className="bg-neutral-200 px-1 rounded">/style-guide</code>
        </footer>
      </div>
    </div>
  );
}
