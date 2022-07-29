
import * as React from 'react'

const MemberPage = ({member}) => {

    const options = [
        {value: 'Blue', text: 'Blue'},
        {value: 'Green', text: 'Green'},
        {value: 'Gold', text: 'Gold'},
        {value: 'Black', text: 'Black'},
      ];

    const [selected, setSelected] = React.useState(options[0].value)

    const handleChange = (event) => {
        console.log(event.target.value)
        setSelected(event.target.value);
      };

    return(
    
        member.map(({customerEmail, cardTier, accountNumber}) => (
            <>
                <div className="border">
                <p>  
                    <span><span key={customerEmail} className="bold">Customer Email:</span> {customerEmail} </span>
                    <span><span key={accountNumber} className="bold">| Account Number:</span> {accountNumber} </span>
                    <span><span key={cardTier} className="bold">| Current Membership Tier:</span> {cardTier} </span>
                </p>
                </div>   
                <div className="memberForm">
                    <h3>Edit Member</h3>
                    <form> 
                    <span>
                        <label>
                            Membership Tier:  
                            <select className="tierSelect" Style="margin-left: 5px" value={selected} onChange={handleChange}>
                                {options.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.text}
                                    </option>
                                ))}
                            </select>
                        </label> </span>
                    </form>        
                    {/* <Link href={`/view-member/${accountNumber}`} className="editButton"><button className="editButton">Save</button></Link> */}
                </div>                     
            </>      
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