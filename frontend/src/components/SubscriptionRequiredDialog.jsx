import { useNavigate, useParams } from "react-router-dom"
import ConfirmationDialog from "./ConfirmationDialog"

// Shown when a user without an active subscription tries to extend or edit a
// contract. Points them to the subscription section instead of performing it.
export default function SubscriptionRequiredDialog({ isOpen, onClose, action = "This action" }) {
    const navigate = useNavigate()
    const { league_id } = useParams()

    if (!isOpen) return null

    return (
        <ConfirmationDialog
            isOpen={true}
            title="Subscription required"
            message={`${action} requires an active subscription.`}
            confirmText="View subscription"
            onConfirm={() => navigate(`/league/${league_id}/settings/subscription`)}
            onCancel={onClose}
        />
    )
}
