import { render } from '@testing-library/react'
import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import React from 'react'

function SimpleComponent() {
  const [count] = useState(0)
  return <div>{count}</div>
}

describe('Simple hook test', () => {
  it('should work', () => {
    const { getByText } = render(<SimpleComponent />)
    expect(getByText('0')).toBeDefined()
  })
})
