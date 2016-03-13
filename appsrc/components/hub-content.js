
import React, {PropTypes, Component} from 'react'
import {connect} from './connect'

import {searchFetched, closeSearch} from '../actions'

class HubItem extends Component {
  render () {
    return <div className='hub_item'>
      <section className='cover' style={{backgroundImage: `url("https://downloads.2kgames.com/xcom2/blog_images/Bx987a1Y_uto0o471x_date.jpg")`}}/>

      <section className='actions'>
        <div className='button'>
          <span className='icon icon-checkmark'/>
          <span>Launch</span>
        </div>
      </section>
    </div>
  }
}

export class HubContent extends Component {
  render () {
    const {t, path, searchOpen, searchResults} = this.props
    searchResults

    return <div className='hub_content'>
      <div className='hub_bread'>
        <section>
          <h2><icon className='icon icon-tag'/> {this.titleForPath(path)}</h2>
          <div className='hub_subtitle'>
          <p>so many elements</p>
          <span className='separator'/>
          <p>a collection by leafbro himself</p>
          </div>
        </section>

        <section className='filler'>
        </section>

        <section>
          <span className='icon_button icon icon-sort-alpha-asc'></span>
        </section>

        <section>
          <span className='icon_button icon icon-filter'></span>
        </section>

        <section>
          <input ref='search' type='search' placeholder={t('search.placeholder')} onChange={this.onChange.bind(this)}/>
        </section>

        <section>
          <span className='icon_button icon icon-lifebuoy'></span>
        </section>

        <section>
          <span className='icon_button icon icon-menu'></span>
        </section>
      </div>
      <div className='hub_meat'>
        <div className='hub_grid'>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <HubItem/>
          <div className='hub_filler'></div>
          <div className='hub_filler'></div>
          <div className='hub_filler'></div>
          <div className='hub_filler'></div>
          <div className='hub_filler'></div>
          <div className='hub_filler'></div>
          <div className='hub_filler'></div>
          <div className='hub_filler'></div>
          <div className='hub_filler'></div>
          <div className='hub_filler'></div>
        </div>
        <div className={`hub_search_results ${ searchOpen ? 'active' : '' }`}>
          <h3>Here are your search results: </h3>
          <div className='hub_grid'>
            <HubItem/>
            <HubItem/>
            <HubItem/>
            <HubItem/>
            <HubItem/>
            <HubItem/>
            <HubItem/>
            <HubItem/>
            <HubItem/>
            <HubItem/>
            <HubItem/>
            <HubItem/>
            <HubItem/>
            <HubItem/>
          </div>
        </div>
      </div>
    </div>
  }

  onChange () {
    if (this.refs.search.value.length > 0) {
      this.props.openSearch()
    } else {
      this.props.closeSearch()
    }
  }

  titleForPath (path) {
    return `page ${path}`
  }
}

HubContent.propTypes = {
  path: PropTypes.string,
  searchOpen: PropTypes.bool,
  searchResults: PropTypes.array,

  openSearch: PropTypes.func,
  closeSearch: PropTypes.func,
  t: PropTypes.func
}

const mapStateToProps = (state) => ({
  path: state.session.navigation.path,
  searchOpen: state.session.navigation.searchOpen,
  searchResults: state.session.navigation.searchResults
})
const mapDispatchToProps = (dispatch) => ({
  openSearch: () => dispatch(searchFetched({results: []})),
  closeSearch: () => dispatch(closeSearch({results: []}))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubContent)
