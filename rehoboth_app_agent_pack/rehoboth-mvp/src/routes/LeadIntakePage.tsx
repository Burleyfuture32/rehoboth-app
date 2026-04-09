import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppActions } from '../domain/store'
import type { CreateLeadInput, DealType } from '../domain/types'
import { PageIntro, SectionCard } from '../ui/primitives'

const residentialPreset: CreateLeadInput = {
  borrowerName: 'Harbor Lane Properties LLC',
  entityType: 'LLC',
  email: 'mia@harborlaneprop.com',
  phone: '(817) 555-0126',
  dealName: 'Harbor Lane SFR Purchase',
  dealType: 'Residential',
  program: 'DSCR Purchase',
  propertyAddress: '624 Harbor Lane',
  market: 'Fort Worth, TX',
  occupancy: 'Lease ready',
  loanAmount: 355000,
  estimatedValue: 485000,
  source: 'Broker referral',
  notes:
    'Borrower is acquiring a renovated rental and wants a simple close with minimal back-and-forth.',
}

const crePreset: CreateLeadInput = {
  borrowerName: 'Northline Storage Partners',
  entityType: 'LP',
  email: 'sam@nslp.com',
  phone: '(713) 555-0108',
  dealName: 'Northline Self-Storage Bridge',
  dealType: 'CRE',
  program: 'Bridge Loan',
  propertyAddress: '2510 Northline Pkwy',
  market: 'Houston, TX',
  occupancy: '84% occupied',
  loanAmount: 4680000,
  estimatedValue: 6500000,
  source: 'Direct inquiry',
  notes:
    'Light value-add storage deal with trailing momentum and sponsor asking for a quick term sheet.',
}

export function LeadIntakePage() {
  const navigate = useNavigate()
  const { createLead } = useAppActions()
  const [form, setForm] = useState<CreateLeadInput>(residentialPreset)

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]:
        name === 'loanAmount' || name === 'estimatedValue'
          ? Number(value)
          : value,
    }))
  }

  function loadPreset(type: DealType) {
    setForm(type === 'Residential' ? residentialPreset : crePreset)
  }

  function handleSubmit(event: ChangeEvent<HTMLFormElement>) {
    event.preventDefault()
    const dealId = createLead(form)
    navigate(`/pipeline?highlight=${dealId}`)
  }

  return (
    <>
      <PageIntro
        eyebrow="Lead intake"
        title="Capture the deal in plain language first"
        subtitle="This is intentionally short. Collect the basics, create the workspace, and let the team refine details later."
      />

      <SectionCard
        title="New lead"
        description="Prefilled demo examples let you show the flow immediately."
        action={
          <div className="row-inline">
            <button
              className="button ghost"
              onClick={() => loadPreset('Residential')}
              type="button"
            >
              Residential example
            </button>
            <button className="button ghost" onClick={() => loadPreset('CRE')} type="button">
              CRE example
            </button>
          </div>
        }
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Borrower name
            <input
              name="borrowerName"
              onChange={handleChange}
              value={form.borrowerName}
            />
          </label>

          <label>
            Entity type
            <input
              name="entityType"
              onChange={handleChange}
              value={form.entityType}
            />
          </label>

          <label>
            Email
            <input name="email" onChange={handleChange} value={form.email} />
          </label>

          <label>
            Phone
            <input name="phone" onChange={handleChange} value={form.phone} />
          </label>

          <label>
            Deal name
            <input name="dealName" onChange={handleChange} value={form.dealName} />
          </label>

          <label>
            Deal type
            <select name="dealType" onChange={handleChange} value={form.dealType}>
              <option value="Residential">Residential</option>
              <option value="CRE">CRE</option>
            </select>
          </label>

          <label>
            Program
            <input name="program" onChange={handleChange} value={form.program} />
          </label>

          <label>
            Lead source
            <input name="source" onChange={handleChange} value={form.source} />
          </label>

          <label className="field-span">
            Property address
            <input
              name="propertyAddress"
              onChange={handleChange}
              value={form.propertyAddress}
            />
          </label>

          <label>
            Market
            <input name="market" onChange={handleChange} value={form.market} />
          </label>

          <label>
            Occupancy
            <input name="occupancy" onChange={handleChange} value={form.occupancy} />
          </label>

          <label>
            Loan amount
            <input
              min={0}
              name="loanAmount"
              onChange={handleChange}
              type="number"
              value={form.loanAmount}
            />
          </label>

          <label>
            Estimated value
            <input
              min={0}
              name="estimatedValue"
              onChange={handleChange}
              type="number"
              value={form.estimatedValue}
            />
          </label>

          <label className="field-span">
            Notes
            <textarea name="notes" onChange={handleChange} rows={4} value={form.notes} />
          </label>

          <div className="field-span form-footer">
            <p className="subdued">
              Submitting creates the borrower, deal workspace, starter tasks, and first
              document requests.
            </p>
            <button className="button" type="submit">
              Create lead and open pipeline
            </button>
          </div>
        </form>
      </SectionCard>
    </>
  )
}
