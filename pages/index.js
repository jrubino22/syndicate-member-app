import Link from 'next/link'
import useRouter from 'next/router'

const Index = ({member}) => {

// function click() {
//     const router = useRouter()

//     router.push(
//         {pathname: `/view-member/${member.accountNumber}`, query: {accountNumber: member.accountNumber}}, `/view-member/${member.accountNumber}`
//     );
// }
    return(
   member.map(({customerEmail, cardTier, accountNumber}) => (
        <div className="border">
        <p>  
            <span> Customer Email: {customerEmail} </span>
            |<span> Membership Tier: {cardTier} </span>
            |<span> Account Number: {accountNumber} </span>         
            <Link href={`/view-member/${accountNumber}`} className="editButton">
                <button className="editButton">Make Edit</button>
                </Link>
        </p> 
        </div>
    )))
}

export async function getServerSideProps(){
    const response = await fetch('http://localhost:5000/api/members')
    const data = await response.json()

    return {
        props: {
            member: data
        }
    }
}


export default Index