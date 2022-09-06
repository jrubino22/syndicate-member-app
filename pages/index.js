import Link from 'next/link'

const Index = ({member}) => {

// function click() {
//     const router = useRouter()

//     router.push(
//         {pathname: `/view-member/${member.accountNumber}`, query: {accountNumber: member.accountNumber}}, `/view-member/${member.accountNumber}`
//     );
// }
    return(
   member.map(({_Id, customerEmail, cardTier, accountNumber}) => (
        <div key={_Id} className="border">
        <p>  
            <span key={customerEmail}> Customer Email: {customerEmail} </span>
            |<span key={cardTier}> Membership Tier: {cardTier} </span>
            |<span key={accountNumber}> Account Number: {accountNumber} </span>         
            <Link key={_Id} href={`/view-member/${accountNumber}`} className="editButton">
                <button className="editButton">View Member</button>
                </Link>
        </p> 
        </div>
    )))
}

export async function getServerSideProps(){
    const response = await fetch('https://syndicate-member.herokuapp.com/api/members')
    const data = await response.json()

    return {
        props: {
            member: data
        }
    }
}


export default Index