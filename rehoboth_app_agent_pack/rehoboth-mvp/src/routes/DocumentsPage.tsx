import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAppActions, useAppState } from '../domain/store'
import { formatDateTime } from '../lib/format'
import { DocumentBadge, PageIntro, SectionCard } from '../ui/primitives'

export function DocumentsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { deals, documentRequests } = useAppState()
  const { requestDocument, uploadDocument } = useAppActions()

  const defaultDealId = searchParams.get('dealId') ?? deals[0]?.id ?? ''
  const [selectedDealId, setSelectedDealId] = useState(defaultDealId)
  const [requestName, setRequestName] = useState('')
  const [requestedFrom, setRequestedFrom] = useState('Borrower')

  const selectedDeal = deals.find((deal) => deal.id === selectedDealId)
  const dealDocs = documentRequests.filter(
    (request) => request.dealId === selectedDealId,
  )

  function handleDealChange(dealId: string) {
    setSelectedDealId(dealId)
    navigate(`/documents?dealId=${dealId}`)
  }

  function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requestName.trim()) {
      return
    }

    requestDocument(selectedDealId, requestName.trim(), requestedFrom.trim())
    setRequestName('')
  }

  return (
    <>
      <PageIntro
        eyebrow="Document center"
        title="Request and upload documents without leaving the deal"
        subtitle="File collection is part of the core workflow, not a side feature."
      />

      <SectionCard
        title="Choose a deal"
        description="Document work stays contextual to a single borrower or property."
      >
        <div className="chip-row">
          {deals.map((deal) => (
            <button
              className={selectedDealId === deal.id ? 'button' : 'button ghost'}
              key={deal.id}
              onClick={() => handleDealChange(deal.id)}
              type="button"
            >
              {deal.name}
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="documents-grid">
        <SectionCard
          title={selectedDeal ? `${selectedDeal.name} files` : 'Files'}
          description="Upload a real file to make the demo tangible."
        >
          <div className="list-stack">
            {dealDocs.map((request) => (
              <div className="document-row" key={request.id}>
                <div>
                  <strong>{request.name}</strong>
                  <p>{request.requestedFrom}</p>
                  {request.uploadedAt ? (
                    <span className="subdued">
                      Uploaded {formatDateTime(request.uploadedAt)}
                    </span>
                  ) : null}
                </div>
                <div className="row-inline row-inline-end">
                  <DocumentBadge status={request.status} />
                  <label className="button ghost upload-button">
                    Upload
                    <input
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) {
                          uploadDocument(request.id, file.name)
                        }
                      }}
                      type="file"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Request another document"
          description="Keep new asks lightweight so the user never leaves the screen."
        >
          <form className="list-stack" onSubmit={handleRequestSubmit}>
            <label>
              Document name
              <input
                onChange={(event) => setRequestName(event.target.value)}
                placeholder="Example: Signed purchase contract"
                value={requestName}
              />
            </label>
            <label>
              Requested from
              <input
                onChange={(event) => setRequestedFrom(event.target.value)}
                value={requestedFrom}
              />
            </label>
            <button className="button" type="submit">
              Add request
            </button>
          </form>
        </SectionCard>
      </div>
    </>
  )
}
