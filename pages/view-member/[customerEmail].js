import { useRouter } from 'next/router'

const MemberPage = () => {
    const router = useRouter()
    const customerEmail = router.query.customerEmail
    return <h1>{customerEmail}</h1>
}

export default MemberPage