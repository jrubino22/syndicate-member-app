import { useRouter } from 'next/router'
import { useEffect } from 'react'

const MemberPage = ({member}) => {
    return(
   member.map(({customerEmail, cardTier, accountNumber}) => (
        <div className="border">
        <p>  
            <span> Customer Email: {customerEmail} </span>
            |<span> Membership Tier: {cardTier} </span>
            |<span> Account Number: {accountNumber} </span>         
            {/* <Link href={`/view-member/${accountNumber}`} className="editButton"><button className="editButton">Save</button></Link> */}
        </p> 
        </div>
    )))
}

export async function getServerSideProps(props){

    const response = await fetch(`http://localhost:5000/api/member/${props.query.memberNum}`)
    const data = await response.json()

    return {
        props: {
            member: data
        }
    }
}


export default MemberPage