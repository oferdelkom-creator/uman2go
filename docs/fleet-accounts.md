# Two-vehicle dispatcher accounts

An approved company owner who is already an approved driver can be enabled by an administrator using `/fleet_enable TELEGRAM_ID` after their current ride ends. The command is idempotent, imports their existing approved vehicle, preserves their driver account/history and sends the owner a localized invitation to enter the second vehicle. The owner uses `/fleet`, `/company`, `/driver` or the Mini App dashboard.

The owner enters model/color, full plate, passenger capacity and actual driver name. No second Telegram account or phone number is created or required. A submitted vehicle starts pending/offline and alerts administrators with `/fleet_approve VEHICLE_ID`. After approval the owner explicitly makes the vehicle available. A maximum of two vehicle records is enforced transactionally.

Quotes bind a particular vehicle and price. The passenger sees that vehicle and actual driver's name, with the company owner as coordinator/contact. Old quote buttons cannot accept different vehicle/price terms. One manager may have two active rides, but the database enforces one active ride per vehicle. Ordinary drivers retain their one-active-ride constraint. The owner chooses which vehicle to quote; no silent vehicle substitution occurs.

Messages and status changes are scoped to explicit ride IDs in the Mini App and bot buttons. With multiple active rides, unscoped bot commands ask the manager to select a ride. All Telegram communication routes through the actual owner account. Vehicle availability, approvals and seats are rechecked at assignment. Company rides record the company at assignment time; past individual trips are not retroactively exposed.

An approved dispatcher can manage fleet operations remotely without a fresh GPS position. Passenger booking retains its GPS requirements. Dispatcher GPS is never forwarded as vehicle GPS and does not contribute to vehicle distance. Without a phone/GPS device in the second vehicle, live tracking and a GPS-derived distance are unavailable; arrival and trip status are reported by the coordinator. The interface and messages identify the coordinator rather than claiming the second driver is directly reachable by phone.

Vehicle additions require administrator review. No vehicle or driver is deleted during conversion, and no existing account is reassigned to another person. Rejection of the underlying driver/company blocks new fleet quotes and assignments. Existing rides can be completed using their ride-specific controls.
